'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM, VirtualConsole } = require('jsdom');

const PUBLIC = path.join(__dirname, 'public');
const FIREBASE_DIR = path.join(__dirname, 'node_modules', 'firebase');

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* Serveur de test éphémère qui sert public/ + les vrais bundles Firebase 11.4.0 compat
   depuis node_modules/firebase/ pour tester l'application sans dépendre d'Internet. */
function demarrerServeurTest() {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      if (u.pathname.startsWith('/__firebase__/')) {
        const nom = path.basename(u.pathname);
        const fp = path.join(FIREBASE_DIR, nom);
        if (fs.existsSync(fp)) {
          res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
          res.end(fs.readFileSync(fp));
          return;
        }
      }

      const candidat = path.resolve(PUBLIC, '.' + u.pathname);
      const cible =
        candidat.startsWith(PUBLIC) && fs.existsSync(candidat) && fs.statSync(candidat).isFile()
          ? candidat
          : path.join(PUBLIC, 'index.html');

      const ext = path.extname(cible).toLowerCase();
      let contenu = fs.readFileSync(cible);
      if (ext === '.html') {
        const port = srv.address().port;
        contenu = Buffer.from(
          contenu
            .toString('utf8')
            .replace(/https:\/\/www\.gstatic\.com\/firebasejs\/11\.4\.0\//g, `http://127.0.0.1:${port}/__firebase__/`)
        );
      }
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(contenu);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* Adaptateur mémoire fidèle à l'API Firebase Compat (Auth + Firestore + Batch + Transactions) */
function creerFirebaseMemoire() {
  const collections = new Map();
  const utilisateursAuth = new Map();
  let autoId = 1;
  let currentUser = null;
  const listeners = new Set();

  function getColMap(nom) {
    if (!collections.has(nom)) collections.set(nom, new Map());
    return collections.get(nom);
  }

  function cloner(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  }

  function creerSnap(id, data) {
    const existe = data !== undefined;
    const copie = existe ? cloner(data) : undefined;
    return {
      id,
      get exists() {
        return existe;
      },
      data() {
        return existe ? cloner(copie) : undefined;
      },
    };
  }

  function creerDocRef(nomCol, idOpt) {
    const id = idOpt || `${nomCol}_${autoId++}`;
    const col = getColMap(nomCol);
    return {
      id,
      async get() {
        return creerSnap(id, col.get(id));
      },
      async set(val, opts) {
        if (opts && opts.merge && col.has(id)) {
          col.set(id, { ...col.get(id), ...cloner(val) });
        } else {
          col.set(id, cloner(val));
        }
      },
      async update(val) {
        if (!col.has(id)) throw Object.assign(new Error('Document introuvable'), { code: 'not-found' });
        col.set(id, { ...col.get(id), ...cloner(val) });
      },
      async delete() {
        col.delete(id);
      },
    };
  }

  function creerQuery(nomCol, filtres = []) {
    return {
      where(champ, op, valeur) {
        return creerQuery(nomCol, [...filtres, { champ, op, valeur }]);
      },
      async get() {
        const col = getColMap(nomCol);
        const docs = [];
        for (const [id, data] of col.entries()) {
          const ok = filtres.every(({ champ, op, valeur }) => {
            if (op === '==') return data[champ] === valeur;
            if (op === 'array-contains') return Array.isArray(data[champ]) && data[champ].includes(valeur);
            return false;
          });
          if (ok) docs.push(creerSnap(id, data));
        }
        return { docs, empty: docs.length === 0, size: docs.length };
      },
    };
  }

  const db = {
    collection(nom) {
      return {
        doc: (id) => creerDocRef(nom, id),
        where: (champ, op, valeur) => creerQuery(nom, [{ champ, op, valeur }]),
        get: () => creerQuery(nom, []).get(),
        async add(val) {
          const ref = creerDocRef(nom);
          await ref.set(val);
          return ref;
        },
      };
    },
    batch() {
      const ops = [];
      return {
        set(ref, val, opts) {
          ops.push(() => ref.set(val, opts));
        },
        update(ref, val) {
          ops.push(() => ref.update(val));
        },
        delete(ref) {
          ops.push(() => ref.delete());
        },
        async commit() {
          for (const op of ops) await op();
        },
      };
    },
    async runTransaction(fn) {
      let ecritureCommencee = false;
      const ecritures = [];
      const tx = {
        async get(ref) {
          if (ecritureCommencee) {
            throw new Error('Firestore transactions require all reads before all writes.');
          }
          return ref.get();
        },
        set(ref, val, opts) {
          ecritureCommencee = true;
          ecritures.push(() => ref.set(val, opts));
        },
        update(ref, val) {
          ecritureCommencee = true;
          ecritures.push(() => ref.update(val));
        },
      };
      const res = await fn(tx);
      for (const w of ecritures) await w();
      return res;
    },
  };

  function notifier() {
    for (const cb of listeners) cb(currentUser);
  }

  const auth = {
    get currentUser() {
      return currentUser;
    },
    onAuthStateChanged(cb) {
      listeners.add(cb);
      setTimeout(() => cb(currentUser), 0);
      return () => listeners.delete(cb);
    },
    async createUserWithEmailAndPassword(email, mdp) {
      if (utilisateursAuth.has(email)) {
        throw Object.assign(new Error('Email in use'), { code: 'auth/email-already-in-use' });
      }
      const uid = `uid_${autoId++}`;
      const user = {
        uid,
        email,
        displayName: '',
        async updateProfile({ displayName }) {
          user.displayName = displayName;
        },
        async getIdToken() {
          return `tok_${uid}`;
        },
      };
      utilisateursAuth.set(email, { user, mdp });
      currentUser = user;
      notifier();
      return { user };
    },
    async signInWithEmailAndPassword(email, mdp) {
      const entree = utilisateursAuth.get(email);
      if (!entree || entree.mdp !== mdp) {
        throw Object.assign(new Error('Invalid credentials'), { code: 'auth/invalid-credential' });
      }
      currentUser = entree.user;
      notifier();
      return { user: currentUser };
    },
    async signOut() {
      currentUser = null;
      notifier();
    },
  };

  return { db, auth };
}

async function testerChargementSdkReel(baseUrl) {
  console.log('=== 1. Vérification du vrai SDK Firebase 11.4.0 (compat) ===');
  const erreurs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erreurs.push('jsdomError: ' + e.message));

  const dom = await JSDOM.fromURL(baseUrl + '/', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.scrollTo = () => {};
    },
  });

  await wait(800);
  const { window } = dom;
  assert.ok(window.firebase, 'window.firebase doit être chargé');
  assert.ok(window.firebaseApp, 'window.firebaseApp doit être initialisé');
  assert.strictEqual(window.firebaseApp.options.projectId, 'bwaka-ac664', 'projectId bwaka-ac664 configuré');
  assert.ok(window.db, 'window.db (Firestore) doit être initialisé');
  assert.ok(window.auth, 'window.auth (Auth) doit être initialisé');
  assert.ok(window.storage, 'window.storage (Storage) doit être initialisé');
  assert.strictEqual(erreurs.length, 0, 'Aucune erreur de chargement JS : ' + erreurs.join('; '));
  console.log('OK  SDK Firebase 11.4.0 chargé et initialisé sur le projet bwaka-ac664 sans erreur JS');

  try {
    await window.firebaseApp.delete();
  } catch {}
  window.close();
}

async function testerParcoursComplet(baseUrl) {
  console.log('\n=== 2. Vérification E2E complète (Auth, Catalogue, Panier, Commandes, Ventes) ===');
  const erreurs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erreurs.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => erreurs.push('console.error: ' + a.join(' ')));

  const mock = creerFirebaseMemoire();

  const dom = await JSDOM.fromURL(baseUrl + '/', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.db = mock.db;
      window.auth = mock.auth;
      window.storage = null;
      window.scrollTo = () => {};
      window.confirm = () => true;
    },
  });

  const { window } = dom;
  const { document } = window;
  await wait(500);

  assert.ok(document.getElementById('app').innerHTML.includes('Aucun produit trouvé'), 'Catalogue vide initial');
  console.log('OK  Accueil initial rendu');

  // 1) Inscription vendeur
  const resVendeur = await window.api('/api/auth/inscription', {
    method: 'POST',
    corps: {
      nom: 'Jean Bosco Nsimba',
      email: 'jean@bwaka.cd',
      telephone: '+243 970 000 001',
      ville: 'Goma',
      motDePasse: 'demo123',
    },
  });
  assert.strictEqual(resVendeur.utilisateur.nom, 'Jean Bosco Nsimba');
  console.log('OK  Inscription vendeur');

  // 2) Import des 12 produits de démonstration
  const { importes } = await window.api('/api/produits/demo', { method: 'POST' });
  assert.strictEqual(importes, 12, '12 produits démo importés');
  const { importes: doublons } = await window.api('/api/produits/demo', { method: 'POST' });
  assert.strictEqual(doublons, 0, 'Pas de doublons au second import');
  console.log('OK  Importation des 12 produits démo (idempotent)');

  // 3) Publication d'un produit personnalisé
  const { produit: nouveauProd } = await window.api('/api/produits', {
    method: 'POST',
    corps: {
      nom: ' Farine de manioc bio 5 kg ',
      description: 'Farine locale fraîche de Goma',
      prix: 12000,
      quantite: 3,
      categorie: 'Alimentation',
      ville: 'Goma',
      image: null,
    },
  });
  assert.ok(nouveauProd.id, 'ID produit attribué');
  assert.strictEqual(nouveauProd.vendeur.nom, 'Jean Bosco Nsimba', 'Vendeur enrichi');
  console.log('OK  Publication produit + enrichissement vendeur');

  // 4) Rendu de l'accueil avec produits + fiche produit
  await window.router();
  assert.ok(document.getElementById('app').innerHTML.includes('Farine de manioc bio 5 kg'), 'Produit affiché sur accueil');
  window.location.hash = `#/produit/${nouveauProd.id}`;
  await wait(250);
  assert.ok(document.getElementById('app').innerHTML.includes('Farine locale fraîche de Goma'), 'Fiche produit rendue');
  console.log('OK  Catalogue et fiche produit rendus');

  // 5) Inscription d'un acheteur et passage de commande
  await window.auth.signOut();
  await window.api('/api/auth/inscription', {
    method: 'POST',
    corps: {
      nom: 'Marie Kabeya',
      email: 'marie@bwaka.cd',
      telephone: '+243 990 111 222',
      ville: 'Kinshasa',
      motDePasse: 'demo123',
    },
  });

  window.ajouterAuPanier(nouveauProd, 2);
  window.location.hash = '#/panier';
  await wait(200);
  assert.ok(
    document.getElementById('app').innerHTML.includes('24\u202f000 FC') ||
      document.getElementById('app').innerHTML.includes('24 000 FC')
  );

  const { commande } = await window.api('/api/commandes', {
    method: 'POST',
    corps: {
      items: [{ produitId: nouveauProd.id, quantite: 2 }],
      adresse: {
        nom: 'Marie Kabeya',
        telephone: '+243 990 111 222',
        ville: 'Goma',
        quartier: 'Katindo',
        indication: 'Près du rond-point',
      },
      methodePaiement: 'M-Pesa (Vodacom)',
    },
  });
  assert.ok(commande.numero.startsWith('BWK-'), 'Numéro de commande généré');
  assert.strictEqual(commande.total, 24000);

  const { produit: apresAchat } = await window.api(`/api/produits/${nouveauProd.id}`);
  assert.strictEqual(apresAchat.quantite, 1, 'Stock décrémenté de 3 à 1');
  console.log('OK  Commande créée + stock décrémenté transactionnellement (' + commande.numero + ')');

  // 6) Confirmation et Mes commandes côté acheteur
  window.location.hash = `#/confirmation/${commande.id}`;
  await wait(200);
  assert.ok(document.getElementById('app').innerHTML.includes(commande.numero), 'Page confirmation rendue');

  window.location.hash = '#/mes-commandes';
  await wait(200);
  assert.ok(document.getElementById('app').innerHTML.includes(commande.numero), 'Mes commandes rendue');
  console.log('OK  Pages Confirmation et Mes commandes rendues');

  // 7) Connexion vendeur : Tableau de bord vendeur (#/ventes) + transition de statut
  await window.auth.signOut();
  await window.api('/api/auth/connexion', {
    method: 'POST',
    corps: { email: 'jean@bwaka.cd', motDePasse: 'demo123' },
  });

  window.location.hash = '#/ventes';
  await wait(250);
  const htmlVentes = document.getElementById('app').innerHTML;
  assert.ok(!htmlVentes.includes('Une erreur est survenue'), 'Aucune erreur sur #/ventes');
  assert.ok(htmlVentes.includes(commande.numero), 'Commande visible dans #/ventes');
  console.log('OK  Tableau de bord vendeur (#/ventes) affiche les ventes et le CA');

  await window.api(`/api/commandes/${commande.id}/statut`, {
    method: 'PATCH',
    corps: { statut: 'confirmee' },
  });
  await window.api(`/api/commandes/${commande.id}/statut`, {
    method: 'PATCH',
    corps: { statut: 'annulee' },
  });
  const { produit: apresAnnulation } = await window.api(`/api/produits/${nouveauProd.id}`);
  assert.strictEqual(apresAnnulation.quantite, 3, 'Stock remis à 3 après annulation');
  console.log('OK  Transitions de statut et remise en stock après annulation');

  assert.strictEqual(erreurs.length, 0, 'Aucune erreur JS : ' + erreurs.join('; '));
  window.close();
}

async function main() {
  const srv = await demarrerServeurTest();
  const baseUrl = `http://127.0.0.1:${srv.address().port}`;
  try {
    await testerChargementSdkReel(baseUrl);
    await testerParcoursComplet(baseUrl);
    console.log('\nToutes les vérifications ont réussi sans aucune erreur.');
  } finally {
    srv.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('ÉCHEC DU TEST :', err);
  process.exit(1);
});
