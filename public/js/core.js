'use strict';

/* ============ État global ============ */
const Etat = {
  token: localStorage.getItem('bwaka_token') || null,
  utilisateur: JSON.parse(localStorage.getItem('bwaka_utilisateur') || 'null'),
  panier: JSON.parse(localStorage.getItem('bwaka_panier') || '[]'),
  referentiels: { categories: [], methodesPaiement: [], villes: [] },
  modeBackend: 'firebase', // 'firebase' | 'local'
  raisonModeLocal: null,   // null | 'base_absente' | 'regles_bloquees' | 'hors_ligne'
};

const cacheProfils = new Map();

function sauverSession() {
  if (Etat.token && Etat.utilisateur) {
    localStorage.setItem('bwaka_token', Etat.token);
    localStorage.setItem('bwaka_utilisateur', JSON.stringify(Etat.utilisateur));
  } else {
    localStorage.removeItem('bwaka_token');
    localStorage.removeItem('bwaka_utilisateur');
  }
}

function sauverPanier() {
  localStorage.setItem('bwaka_panier', JSON.stringify(Etat.panier));
  majBadgePanier();
}

/* ============ Référentiels ============ */
function chargerReferentiels() {
  Etat.referentiels = {
    categories: Referentiels.categories.slice(),
    methodesPaiement: Referentiels.methodesPaiement.slice(),
    villes: Referentiels.villes.slice(),
  };
  return Etat.referentiels;
}

/* ============ Base locale de repli automatique (localStorage) ============
   Permet à l'application (catalogue, panier, comptes, publication, commandes, ventes)
   de fonctionner immédiatement même tant que Cloud Firestore n'est pas encore créé
   ou configuré dans la Console Firebase. */
function creerBaseLocale() {
  const CLE_DB = 'bwaka_base_locale_v1';
  const CLE_AUTH = 'bwaka_auth_local_v1';
  const listeners = new Set();

  function cloner(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  }

  function construireEtatInitial() {
    const profils = {
      u1: {
        id: 'u1',
        nom: 'Jean Bosco Nsimba',
        email: 'jean@bwaka.cd',
        telephone: '+243 970 000 001',
        ville: 'Goma',
        createdAt: '2026-09-12T08:00:00.000Z',
      },
      u2: {
        id: 'u2',
        nom: 'Grace Mbuyi',
        email: 'grace@bwaka.cd',
        telephone: '+243 990 000 002',
        ville: 'Kinshasa',
        createdAt: '2026-09-20T10:30:00.000Z',
      },
      u3: {
        id: 'u3',
        nom: 'Espérance Kavira',
        email: 'esperance@bwaka.cd',
        telephone: '+243 971 000 003',
        ville: 'Bukavu',
        createdAt: '2026-10-01T14:15:00.000Z',
      },
    };

    const comptesAuth = {
      'jean@bwaka.cd': { uid: 'u1', email: 'jean@bwaka.cd', mdp: 'demo123', displayName: 'Jean Bosco Nsimba' },
      'grace@bwaka.cd': { uid: 'u2', email: 'grace@bwaka.cd', mdp: 'demo123', displayName: 'Grace Mbuyi' },
      'esperance@bwaka.cd': { uid: 'u3', email: 'esperance@bwaka.cd', mdp: 'demo123', displayName: 'Espérance Kavira' },
    };

    const vendeursCycle = ['u1', 'u2', 'u3'];
    const produits = {};
    const baseTemps = Date.parse('2026-10-25T12:00:00.000Z');
    (Referentiels.produitsDemo || []).forEach((item, idx) => {
      const id = `p${idx + 1}`;
      produits[id] = {
        id,
        nom: item.nom,
        description: item.description,
        prix: item.prix,
        categorie: item.categorie,
        quantite: item.quantite,
        image: item.image || null,
        vendeurId: vendeursCycle[idx % vendeursCycle.length],
        ville: item.ville,
        statut: 'actif',
        createdAt: new Date(baseTemps - idx * 3600000).toISOString(),
      };
    });

    return {
      autoId: 100,
      collections: {
        profils,
        produits,
        commandes: {},
        compteurs: { global: { commande: 1000 } },
      },
      comptesAuth,
    };
  }

  function chargerEtat() {
    try {
      const brut = localStorage.getItem(CLE_DB);
      if (brut) {
        const parsed = JSON.parse(brut);
        if (parsed && parsed.collections && parsed.comptesAuth) return parsed;
      }
    } catch {}
    const init = construireEtatInitial();
    sauverEtat(init);
    return init;
  }

  function sauverEtat(st) {
    try {
      localStorage.setItem(CLE_DB, JSON.stringify(st));
    } catch {}
  }

  let state = chargerEtat();

  function creerUserObj(entree) {
    if (!entree) return null;
    return {
      uid: entree.uid,
      email: entree.email,
      displayName: entree.displayName || '',
      async updateProfile({ displayName }) {
        entree.displayName = displayName || '';
        sauverEtat(state);
      },
      async getIdToken() {
        return `local_${entree.uid}`;
      },
    };
  }

  function chargerCurrentUser() {
    try {
      const email = localStorage.getItem(CLE_AUTH);
      if (email && state.comptesAuth[email]) {
        return creerUserObj(state.comptesAuth[email]);
      }
    } catch {}
    return null;
  }

  let currentUser = chargerCurrentUser();

  function getCol(nom) {
    if (!state.collections[nom]) state.collections[nom] = {};
    return state.collections[nom];
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
    if (!idOpt) {
      state.autoId = (state.autoId || 100) + 1;
      sauverEtat(state);
    }
    const id = idOpt || `${nomCol}_${Date.now().toString(36)}_${state.autoId}`;
    return {
      id,
      async get() {
        const col = getCol(nomCol);
        return creerSnap(id, col[id]);
      },
      async set(val, opts) {
        const col = getCol(nomCol);
        if (opts && opts.merge && col[id]) {
          col[id] = { ...col[id], ...cloner(val) };
        } else {
          col[id] = cloner(val);
        }
        sauverEtat(state);
      },
      async update(val) {
        const col = getCol(nomCol);
        if (!col[id]) throw Object.assign(new Error('Document introuvable'), { code: 'not-found' });
        col[id] = { ...col[id], ...cloner(val) };
        sauverEtat(state);
      },
      async delete() {
        const col = getCol(nomCol);
        delete col[id];
        sauverEtat(state);
      },
    };
  }

  function creerQuery(nomCol, filtres = []) {
    return {
      where(champ, op, valeur) {
        return creerQuery(nomCol, [...filtres, { champ, op, valeur }]);
      },
      async get() {
        const col = getCol(nomCol);
        const docs = [];
        for (const [id, data] of Object.entries(col)) {
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
        set(ref, val, opts) { ops.push(() => ref.set(val, opts)); },
        update(ref, val) { ops.push(() => ref.update(val)); },
        delete(ref) { ops.push(() => ref.delete()); },
        async commit() {
          for (const op of ops) await op();
        },
      };
    },
    async runTransaction(fn) {
      const ecritures = [];
      const tx = {
        get: (ref) => ref.get(),
        set: (ref, val, opts) => { ecritures.push(() => ref.set(val, opts)); },
        update: (ref, val) => { ecritures.push(() => ref.update(val)); },
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
      const emailNorm = String(email).trim().toLowerCase();
      if (state.comptesAuth[emailNorm]) {
        throw Object.assign(new Error('Email in use'), { code: 'auth/email-already-in-use' });
      }
      state.autoId = (state.autoId || 100) + 1;
      const uid = `u_${Date.now().toString(36)}_${state.autoId}`;
      const entree = { uid, email: emailNorm, mdp: String(mdp), displayName: '' };
      state.comptesAuth[emailNorm] = entree;
      sauverEtat(state);
      try { localStorage.setItem(CLE_AUTH, emailNorm); } catch {}
      currentUser = creerUserObj(entree);
      notifier();
      return { user: currentUser };
    },
    async signInWithEmailAndPassword(email, mdp) {
      const emailNorm = String(email).trim().toLowerCase();
      const entree = state.comptesAuth[emailNorm];
      if (!entree || entree.mdp !== String(mdp)) {
        throw Object.assign(new Error('Invalid credentials'), { code: 'auth/invalid-credential' });
      }
      try { localStorage.setItem(CLE_AUTH, emailNorm); } catch {}
      currentUser = creerUserObj(entree);
      notifier();
      return { user: currentUser };
    },
    async signOut() {
      try { localStorage.removeItem(CLE_AUTH); } catch {}
      currentUser = null;
      notifier();
    },
  };

  return { db, auth };
}

const BaseLocale = creerBaseLocale();

function obtenirDb() {
  return Etat.modeBackend === 'local' ? BaseLocale.db : window.db;
}

function obtenirAuth() {
  return Etat.modeBackend === 'local' ? BaseLocale.auth : window.auth;
}

function basculerEnModeLocal(raison = 'hors_ligne') {
  if (Etat.modeBackend !== 'local') {
    Etat.modeBackend = 'local';
    Etat.raisonModeLocal = raison;
    cacheProfils.clear();
    const userLocal = BaseLocale.auth.currentUser;
    if (!userLocal) {
      Etat.token = null;
      Etat.utilisateur = null;
      sauverSession();
    }
    if (typeof window.majBandeauBackend === 'function') window.majBandeauBackend();
    if (typeof window.majZoneCompte === 'function') window.majZoneCompte();
  }
}

/* Sonde rapide de disponibilité Cloud Firestore :
   Vérifie en ~300 ms si la base (default) du projet Firebase existe et accepte la lecture,
   sans bloquer l'interface pendant de longues secondes si Firestore n'est pas encore créé. */
async function initialiserBackend() {
  cacheProfils.clear();

  // Cas des tests automatisés avec adaptateur mémoire injecté (sans firebaseApp réel)
  if (window.db && window.auth && !window.firebaseApp) {
    Etat.modeBackend = 'firebase';
    Etat.raisonModeLocal = null;
    return Etat.modeBackend;
  }

  if (!window.db || !window.auth || !window.firebaseConfig || !window.firebaseConfig.projectId) {
    Etat.modeBackend = 'local';
    Etat.raisonModeLocal = 'hors_ligne';
    return Etat.modeBackend;
  }

  const { projectId, apiKey } = window.firebaseConfig;
  const urlSonde =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/(default)/documents/produits?pageSize=1&key=${encodeURIComponent(apiKey || '')}`;

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, 3500);

  try {
    const res = await fetch(urlSonde, ctrl ? { signal: ctrl.signal } : undefined);
    clearTimeout(timer);

    if (res.ok) {
      Etat.modeBackend = 'firebase';
      Etat.raisonModeLocal = null;
    } else if (res.status === 404) {
      Etat.modeBackend = 'local';
      Etat.raisonModeLocal = 'base_absente';
    } else if (res.status === 401 || res.status === 403) {
      Etat.modeBackend = 'local';
      Etat.raisonModeLocal = 'regles_bloquees';
    } else {
      Etat.modeBackend = 'local';
      Etat.raisonModeLocal = 'hors_ligne';
    }
  } catch {
    clearTimeout(timer);
    Etat.modeBackend = 'local';
    Etat.raisonModeLocal = 'hors_ligne';
  }

  return Etat.modeBackend;
}

window.initialiserBackend = initialiserBackend;

/* ============ Helpers Firebase / Firestore ============ */
function docExiste(snap) {
  if (!snap) return false;
  return typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
}

function creerErreurClient(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  err._dejaFormate = true;
  return err;
}

function erreurFirebase(err, statutParDefaut = 500) {
  if (err && err._dejaFormate) return err;

  const code = String((err && err.code) || '').toLowerCase();
  const brut = String((err && err.message) || '');

  const correspondances = {
    'auth/email-already-in-use': ['Un compte existe déjà avec cet e-mail.', 409],
    'auth/invalid-email': ['Adresse e-mail invalide.', 400],
    'auth/weak-password': ['Le mot de passe doit contenir au moins 6 caractères.', 400],
    'auth/user-not-found': ['E-mail ou mot de passe incorrect.', 401],
    'auth/wrong-password': ['E-mail ou mot de passe incorrect.', 401],
    'auth/invalid-credential': ['E-mail ou mot de passe incorrect.', 401],
    'auth/invalid-login-credentials': ['E-mail ou mot de passe incorrect.', 401],
    'auth/user-disabled': ['Ce compte utilisateur a été désactivé.', 403],
    'auth/too-many-requests': ['Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.', 429],
    'auth/operation-not-allowed': [
      'La connexion E-mail/Mot de passe n’est pas activée dans la Console Firebase (Authentication > Mode de connexion).',
      500,
    ],
    'auth/configuration-not-found': [
      'L’authentification Firebase n’est pas encore activée (Console Firebase > Authentication > Commencer).',
      500,
    ],
    'auth/network-request-failed': ['Impossible de joindre Firebase. Vérifiez votre connexion Internet.', 503],
    'permission-denied': [
      'Accès refusé par les règles Firestore. Publiez firestore.rules dans la Console Firebase.',
      403,
    ],
    'unavailable': ['Service Firestore temporairement indisponible. Vérifiez votre connexion Internet.', 503],
    'failed-precondition': ['Requête refusée par Firestore (précondition ou configuration de la base).', 400],
  };

  for (const [cle, [msg, st]] of Object.entries(correspondances)) {
    if (code === cle || code.endsWith('/' + cle)) {
      return creerErreurClient(msg, st);
    }
  }

  const out = new Error(brut || 'Une erreur inattendue est survenue.');
  out.status = (err && err.status) || statutParDefaut;
  return out;
}

function lireFichierDataUrl(file) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result || ''));
    lecteur.onerror = () => reject(creerErreurClient('Impossible de lire le fichier image.', 400));
    lecteur.readAsDataURL(file);
  });
}

async function compresserImageDataUrl(file, maxDim = 800, qualite = 0.78) {
  const dataUrl = await lireFichierDataUrl(file);
  if (typeof Image === 'undefined' || typeof document === 'undefined') return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (!width || !height) return resolve(dataUrl);
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        const resultat = canvas.toDataURL('image/jpeg', qualite);
        resolve(resultat && resultat.startsWith('data:image/') ? resultat : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function assurerProfilUtilisateur(dbActive, user, defauts = {}) {
  const refProfil = dbActive.collection('profils').doc(user.uid);
  const snap = await refProfil.get();
  if (docExiste(snap)) {
    const data = { id: user.uid, ...snap.data() };
    cacheProfils.set(user.uid, data);
    return data;
  }
  const emailNorm = String(defauts.email || user.email || '').trim().toLowerCase();
  const nomParDefaut = defauts.nom || user.displayName || (emailNorm ? emailNorm.split('@')[0] : 'Membre Bwaka');
  const profil = {
    id: user.uid,
    nom: String(nomParDefaut).trim(),
    email: emailNorm,
    telephone: String(defauts.telephone || '').trim(),
    ville: String(defauts.ville || 'Goma').trim(),
    createdAt: new Date().toISOString(),
  };
  await refProfil.set(profil);
  cacheProfils.set(user.uid, profil);
  return profil;
}

/* ============ API (façade compatible avec l'interface /api/*) ============ */
async function api(chemin, options = {}) {
  const methode = (options.method || 'GET').toUpperCase();
  let corpsBrut = options.corps;
  if (corpsBrut && !(corpsBrut instanceof FormData) && typeof corpsBrut !== 'string') {
    corpsBrut = JSON.stringify(corpsBrut);
  }

  let url = String(chemin || '');
  let searchParams = new URLSearchParams();
  const idxQ = url.indexOf('?');
  if (idxQ >= 0) {
    searchParams = new URLSearchParams(url.slice(idxQ + 1));
    url = url.slice(0, idxQ);
  }

  try {
    // ---------- Référentiels ----------
    if (url === '/api/referentiels' && methode === 'GET') {
      return { ...chargerReferentiels() };
    }

    let dbActive = obtenirDb();
    let authActive = obtenirAuth();
    if (!dbActive || !authActive) {
      basculerEnModeLocal('hors_ligne');
      dbActive = obtenirDb();
      authActive = obtenirAuth();
    }

    let colProduits = dbActive.collection('produits');
    let colCommandes = dbActive.collection('commandes');
    let colProfils = dbActive.collection('profils');

    // ---------- Authentification ----------
    if (url === '/api/auth/inscription' && methode === 'POST') {
      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const { nom, email, telephone, ville, motDePasse } = body;
      if (!nom || !email || !telephone || !ville || !motDePasse) {
        throw creerErreurClient('Tous les champs sont obligatoires', 400);
      }
      const emailNorm = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
        throw creerErreurClient('Adresse e-mail invalide', 400);
      }
      if (String(motDePasse).length < 6) {
        throw creerErreurClient('Le mot de passe doit contenir au moins 6 caractères', 400);
      }

      const cred = await authActive.createUserWithEmailAndPassword(emailNorm, String(motDePasse));
      const user = cred.user;
      try {
        if (typeof user.updateProfile === 'function') {
          await user.updateProfile({ displayName: String(nom).trim() });
        }
      } catch {}

      const profil = {
        id: user.uid,
        nom: String(nom).trim(),
        email: emailNorm,
        telephone: String(telephone).trim(),
        ville: String(ville).trim(),
        createdAt: new Date().toISOString(),
      };
      await colProfils.doc(user.uid).set(profil);
      cacheProfils.set(user.uid, profil);

      const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : user.uid;
      Etat.token = token;
      Etat.utilisateur = profil;
      sauverSession();
      return { token, utilisateur: profil };
    }

    if (url === '/api/auth/connexion' && methode === 'POST') {
      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const { email, motDePasse } = body;
      if (!email || !motDePasse) {
        throw creerErreurClient('Veuillez saisir votre e-mail et votre mot de passe', 400);
      }
      const emailNorm = String(email).trim().toLowerCase();
      const cred = await authActive.signInWithEmailAndPassword(emailNorm, String(motDePasse));
      const user = cred.user;
      const profil = await assurerProfilUtilisateur(dbActive, user, { email: emailNorm });
      const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : user.uid;
      Etat.token = token;
      Etat.utilisateur = profil;
      sauverSession();
      return { token, utilisateur: profil };
    }

    if (url === '/api/auth/moi' && methode === 'GET') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Non connecté', 401);
      const profil = await assurerProfilUtilisateur(dbActive, user);
      const token = typeof user.getIdToken === 'function' ? await user.getIdToken() : user.uid;
      Etat.token = token;
      Etat.utilisateur = profil;
      sauverSession();
      return { utilisateur: profil };
    }

    // ---------- Produits ----------
    if (url === '/api/produits' && methode === 'GET') {
      const q = searchParams.get('q') || '';
      const categorie = searchParams.get('categorie') || '';
      const ville = searchParams.get('ville') || '';
      const vendeur = searchParams.get('vendeur') || '';
      const tri = searchParams.get('tri') || '';
      const inclureInactifs = searchParams.get('inclureInactifs') === '1';

      let snap;
      try {
        const reqFirestore = vendeur
          ? colProduits.where('vendeurId', '==', vendeur)
          : colProduits.where('statut', '==', 'actif');

        snap = await Promise.race([
          reqFirestore.get(),
          new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'unavailable' })), 6000)),
        ]);
      } catch (errLecture) {
        // Repli transparent vers la base locale si Cloud Firestore est inaccessible
        if (Etat.modeBackend === 'firebase' && window.firebaseApp) {
          const codeErr = String((errLecture && errLecture.code) || '');
          basculerEnModeLocal(codeErr.includes('permission') ? 'regles_bloquees' : 'hors_ligne');
          dbActive = obtenirDb();
          colProduits = dbActive.collection('produits');
          const reqLocal = vendeur
            ? colProduits.where('vendeurId', '==', vendeur)
            : colProduits.where('statut', '==', 'actif');
          snap = await reqLocal.get();
        } else {
          throw errLecture;
        }
      }

      let liste = snap.docs.map((d) => ({ ...d.data(), id: d.id }));

      if (!inclureInactifs) {
        liste = liste.filter((p) => p.statut === 'actif');
      }
      if (categorie) liste = liste.filter((p) => p.categorie === categorie);
      if (ville) liste = liste.filter((p) => p.ville === ville);
      if (vendeur) liste = liste.filter((p) => p.vendeurId === vendeur);

      if (q) {
        const terme = String(q).toLowerCase();
        liste = liste.filter(
          (p) =>
            String(p.nom || '').toLowerCase().includes(terme) ||
            String(p.description || '').toLowerCase().includes(terme) ||
            String(p.categorie || '').toLowerCase().includes(terme)
        );
      }

      liste.sort((a, b) => {
        if (tri === 'prix_asc') return (a.prix || 0) - (b.prix || 0);
        if (tri === 'prix_desc') return (b.prix || 0) - (a.prix || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      return { produits: await enrichirProduits(liste) };
    }

    if (url === '/api/produits/demo' && methode === 'POST') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise pour importer les produits', 401);
      await assurerProfilUtilisateur(dbActive, user);

      const existantsSnap = await colProduits.where('vendeurId', '==', user.uid).get();
      const nomsExistants = new Set(
        existantsSnap.docs.map((d) => String(d.data().nom || '').trim().toLowerCase())
      );

      const aCreer = (Referentiels.produitsDemo || []).filter(
        (d) => !nomsExistants.has(String(d.nom).trim().toLowerCase())
      );

      if (aCreer.length > 0) {
        const batch = dbActive.batch();
        const maintenant = Date.now();
        aCreer.forEach((item, idx) => {
          const docRef = colProduits.doc();
          batch.set(docRef, {
            id: docRef.id,
            nom: item.nom,
            description: item.description,
            prix: Math.round(Number(item.prix)),
            categorie: item.categorie,
            quantite: Math.max(1, Number(item.quantite) || 1),
            image: item.image || null,
            vendeurId: user.uid,
            ville: item.ville,
            statut: 'actif',
            createdAt: new Date(maintenant - idx * 60000).toISOString(),
          });
        });
        await batch.commit();
      }

      return { importes: aCreer.length };
    }

    const matchProduit = url.match(/^\/api\/produits\/([^/]+)$/);
    if (matchProduit && methode === 'GET') {
      const id = decodeURIComponent(matchProduit[1]);
      const snap = await colProduits.doc(id).get();
      if (!docExiste(snap)) throw creerErreurClient('Produit introuvable', 404);
      return { produit: await produitComplet({ ...snap.data(), id: snap.id }) };
    }

    if (url === '/api/produits' && methode === 'POST') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const { nom, description, prix, categorie, quantite, ville, image } = body;
      if (!nom || !description || !prix || !categorie || !ville) {
        throw creerErreurClient('Nom, description, prix, catégorie et ville sont obligatoires', 400);
      }
      const prixNum = Number(prix);
      if (!Number.isFinite(prixNum) || prixNum <= 0) {
        throw creerErreurClient('Le prix doit être un nombre positif', 400);
      }

      const docRef = colProduits.doc();
      const produit = {
        id: docRef.id,
        nom: String(nom).trim(),
        description: String(description).trim(),
        prix: Math.round(prixNum),
        categorie: String(categorie),
        quantite: Math.max(1, Number(quantite) || 1),
        image: image ? String(image) : null,
        vendeurId: user.uid,
        ville: String(ville).trim(),
        statut: 'actif',
        createdAt: new Date().toISOString(),
      };
      await docRef.set(produit);
      return { produit: await produitComplet(produit) };
    }

    if (matchProduit && methode === 'PUT') {
      const id = decodeURIComponent(matchProduit[1]);
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const docRef = colProduits.doc(id);
      const snap = await docRef.get();
      if (!docExiste(snap)) throw creerErreurClient('Produit introuvable', 404);
      const p = snap.data();
      if (p.vendeurId !== user.uid) {
        throw creerErreurClient('Vous ne pouvez modifier que vos propres produits', 403);
      }

      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const misesAJour = {};
      for (const c of ['nom', 'description', 'categorie', 'ville', 'image']) {
        if (body[c] !== undefined) misesAJour[c] = body[c] === null ? null : String(body[c]);
      }
      if (body.prix !== undefined) {
        const prixNum = Number(body.prix);
        if (!Number.isFinite(prixNum) || prixNum <= 0) {
          throw creerErreurClient('Le prix doit être un nombre positif', 400);
        }
        misesAJour.prix = Math.round(prixNum);
      }
      if (body.quantite !== undefined) {
        misesAJour.quantite = Math.max(0, Number(body.quantite) || 0);
      }
      if (body.statut === 'actif' || body.statut === 'inactif') {
        misesAJour.statut = body.statut;
      }

      await docRef.update(misesAJour);
      const snap2 = await docRef.get();
      return { produit: await produitComplet({ ...snap2.data(), id: snap2.id }) };
    }

    if (matchProduit && methode === 'DELETE') {
      const id = decodeURIComponent(matchProduit[1]);
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const docRef = colProduits.doc(id);
      const snap = await docRef.get();
      if (!docExiste(snap)) throw creerErreurClient('Produit introuvable', 404);
      if (snap.data().vendeurId !== user.uid) {
        throw creerErreurClient('Vous ne pouvez supprimer que vos propres produits', 403);
      }

      await docRef.delete();
      return { ok: true };
    }

    // ---------- Upload d'image ----------
    if (url === '/api/upload' && methode === 'POST') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const file = options.corps instanceof FormData ? options.corps.get('image') : null;
      if (!file) throw creerErreurClient('Aucune image reçue', 400);
      if (file.type && !/^image\//.test(file.type)) {
        throw creerErreurClient('Seules les images sont acceptées', 400);
      }
      if (file.size && file.size > 5 * 1024 * 1024) {
        throw creerErreurClient('L’image ne doit pas dépasser 5 Mo', 400);
      }

      if (Etat.modeBackend === 'firebase' && window.storage && typeof window.storage.ref === 'function') {
        try {
          const nomFichier = file.name || 'image.jpg';
          const point = nomFichier.lastIndexOf('.');
          const ext = point >= 0 ? nomFichier.slice(point).toLowerCase() : '.jpg';
          const cheminStorage = `uploads/${user.uid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
          const storageRef = window.storage.ref(cheminStorage);

          const urlDownload = await Promise.race([
            storageRef.put(file).then(() => storageRef.getDownloadURL()),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 6000)),
          ]);
          return { url: urlDownload };
        } catch {}
      }

      const dataUrl = await compresserImageDataUrl(file);
      return { url: dataUrl };
    }

    // ---------- Commandes ----------
    if (url === '/api/commandes' && methode === 'POST') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const { items, adresse, methodePaiement } = body;

      if (!Array.isArray(items) || items.length === 0) {
        throw creerErreurClient('Votre panier est vide', 400);
      }
      if (!adresse || !adresse.nom || !adresse.telephone || !adresse.ville || !adresse.quartier) {
        throw creerErreurClient('Veuillez compléter l’adresse de livraison', 400);
      }
      if (!Referentiels.methodesPaiement.includes(methodePaiement)) {
        throw creerErreurClient('Méthode de paiement invalide', 400);
      }

      const demandes = new Map();
      for (const item of items) {
        const pid = String(item.produitId || '').trim();
        if (!pid) throw creerErreurClient('Produit invalide dans le panier', 400);
        const qte = Math.max(1, Number(item.quantite) || 1);
        demandes.set(pid, (demandes.get(pid) || 0) + qte);
      }

      const cmdRef = colCommandes.doc();
      const compteurRef = dbActive.collection('compteurs').doc('global');

      const commande = await dbActive.runTransaction(async (tx) => {
        const pids = [...demandes.keys()];
        const prodRefs = pids.map((pid) => colProduits.doc(pid));
        const prodSnaps = [];
        for (const ref of prodRefs) {
          prodSnaps.push(await tx.get(ref));
        }
        const compteurSnap = await tx.get(compteurRef);

        const lignes = [];
        const vendeurIds = new Set();

        prodSnaps.forEach((snap, idx) => {
          const pid = pids[idx];
          if (!docExiste(snap)) {
            throw creerErreurClient(`Produit indisponible : ${pid}`, 400);
          }
          const p = snap.data();
          if (p.statut !== 'actif') {
            throw creerErreurClient(`Produit indisponible : « ${p.nom || pid} »`, 400);
          }
          const qteDemandee = demandes.get(pid);
          if ((p.quantite || 0) < qteDemandee) {
            throw creerErreurClient(`Stock insuffisant pour « ${p.nom} »`, 400);
          }
          lignes.push({
            produitId: snap.id,
            nom: p.nom,
            prix: p.prix,
            image: p.image || null,
            quantite: qteDemandee,
            vendeurId: p.vendeurId,
          });
          vendeurIds.add(p.vendeurId);
        });

        const numeroCommande = (docExiste(compteurSnap) ? (compteurSnap.data().commande || 1000) : 1000) + 1;

        const docCommande = {
          id: cmdRef.id,
          numero: `BWK-${new Date().getFullYear()}-${String(numeroCommande).padStart(4, '0')}`,
          acheteurId: user.uid,
          items: lignes,
          total: lignes.reduce((s, l) => s + l.prix * l.quantite, 0),
          adresse: {
            nom: String(adresse.nom).trim(),
            telephone: String(adresse.telephone).trim(),
            ville: String(adresse.ville).trim(),
            quartier: String(adresse.quartier).trim(),
            indication: String(adresse.indication || '').trim(),
          },
          methodePaiement,
          statut: 'en_attente',
          createdAt: new Date().toISOString(),
          vendeurIds: [...vendeurIds],
        };

        prodSnaps.forEach((snap, idx) => {
          const p = snap.data();
          const nouvelleQte = Math.max(0, (p.quantite || 0) - demandes.get(pids[idx]));
          const majProduit = { quantite: nouvelleQte };
          if (nouvelleQte <= 0) majProduit.statut = 'inactif';
          tx.update(prodRefs[idx], majProduit);
        });

        tx.set(compteurRef, { commande: numeroCommande }, { merge: true });
        tx.set(cmdRef, docCommande);
        return docCommande;
      });

      return { commande };
    }

    if (url === '/api/commandes' && methode === 'GET') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);
      const snap = await colCommandes.where('acheteurId', '==', user.uid).get();
      const commandes = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return { commandes };
    }

    if (url === '/api/ventes' && methode === 'GET') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);
      const snap = await colCommandes.where('vendeurIds', 'array-contains', user.uid).get();
      const ventes = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            items: (data.items || []).filter((i) => i.vendeurId === user.uid),
          };
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return { ventes };
    }

    const matchStatut = url.match(/^\/api\/commandes\/([^/]+)\/statut$/);
    if (matchStatut && methode === 'PATCH') {
      const id = decodeURIComponent(matchStatut[1]);
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const body = corpsBrut ? JSON.parse(corpsBrut) : {};
      const nouveau = body.statut;
      const cmdRef = colCommandes.doc(id);

      const TRANSITIONS = {
        en_attente: ['confirmee', 'annulee'],
        confirmee: ['expediee', 'annulee'],
        expediee: ['livree'],
        livree: [],
        annulee: [],
      };

      const commandeMaj = await dbActive.runTransaction(async (tx) => {
        const snap = await tx.get(cmdRef);
        if (!docExiste(snap)) throw creerErreurClient('Commande introuvable', 404);
        const commande = snap.data();

        const acheteur = commande.acheteurId === user.uid;
        const vendeur = Array.isArray(commande.vendeurIds) && commande.vendeurIds.includes(user.uid);
        if (!acheteur && !vendeur) throw creerErreurClient('Accès refusé', 403);
        if (acheteur && !vendeur && nouveau !== 'annulee') {
          throw creerErreurClient('Seul le vendeur peut mettre à jour le statut', 403);
        }
        if (!TRANSITIONS[commande.statut] || !TRANSITIONS[commande.statut].includes(nouveau)) {
          throw creerErreurClient(`Transition impossible : ${commande.statut} → ${nouveau}`, 400);
        }

        const lecturesProduits = [];
        if (nouveau === 'annulee' && Array.isArray(commande.items)) {
          for (const ligne of commande.items) {
            if (!ligne.produitId) continue;
            const pRef = colProduits.doc(ligne.produitId);
            const pSnap = await tx.get(pRef);
            lecturesProduits.push({ pRef, pSnap, quantite: ligne.quantite || 0 });
          }
        }

        for (const { pRef, pSnap, quantite } of lecturesProduits) {
          if (!docExiste(pSnap)) continue;
          const p = pSnap.data();
          const nouvelleQte = (p.quantite || 0) + quantite;
          const majP = { quantite: nouvelleQte };
          if (p.statut === 'inactif' && nouvelleQte > 0) majP.statut = 'actif';
          tx.update(pRef, majP);
        }

        tx.update(cmdRef, { statut: nouveau });
        return { ...commande, id: snap.id, statut: nouveau };
      });

      return { commande: commandeMaj };
    }

    // ---------- Statistiques vendeur ----------
    if (url === '/api/stats' && methode === 'GET') {
      const user = authActive.currentUser;
      if (!user) throw creerErreurClient('Connexion requise', 401);

      const [mesProduitsSnap, mesVentesSnap] = await Promise.all([
        colProduits.where('vendeurId', '==', user.uid).get(),
        colCommandes.where('vendeurIds', 'array-contains', user.uid).get(),
      ]);

      const mesProduits = mesProduitsSnap.docs.map((d) => ({ ...d.data(), id: d.id }));
      const mesVentes = mesVentesSnap.docs.map((d) => ({ ...d.data(), id: d.id }));

      const chiffreAffaires = mesVentes
        .filter((c) => c.statut !== 'annulee')
        .reduce(
          (s, c) =>
            s +
            (c.items || [])
              .filter((i) => i.vendeurId === user.uid)
              .reduce((t, i) => t + i.prix * i.quantite, 0),
          0
        );

      return {
        produitsActifs: mesProduits.filter((p) => p.statut === 'actif').length,
        totalProduits: mesProduits.length,
        ventes: mesVentes.length,
        chiffreAffaires,
      };
    }

    throw creerErreurClient('Route inconnue', 404);
  } catch (err) {
    throw erreurFirebase(err);
  }
}

/* ============ Enrichissement vendeur (avec cache parallèle) ============ */
async function vendeurPublic(uid) {
  const dbActive = obtenirDb();
  if (!uid || !dbActive) return null;
  if (cacheProfils.has(uid)) {
    const u = cacheProfils.get(uid);
    return u ? { id: u.id, nom: u.nom, ville: u.ville, telephone: u.telephone, membreDepuis: u.createdAt } : null;
  }
  try {
    const snap = await dbActive.collection('profils').doc(uid).get();
    if (!docExiste(snap)) {
      cacheProfils.set(uid, null);
      return null;
    }
    const u = { id: snap.id, ...snap.data() };
    cacheProfils.set(uid, u);
    return { id: u.id, nom: u.nom, ville: u.ville, telephone: u.telephone, membreDepuis: u.createdAt };
  } catch {
    return null;
  }
}

async function produitComplet(p) {
  return { ...p, vendeur: await vendeurPublic(p.vendeurId) };
}

async function enrichirProduits(liste) {
  const uids = [...new Set(liste.map((p) => p.vendeurId).filter(Boolean))];
  await Promise.all(uids.map((uid) => vendeurPublic(uid)));
  return Promise.all(liste.map((p) => produitComplet(p)));
}

/* ============ Formatage ============ */
function fc(montant) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant || 0)) + ' FC';
}

function dateCourte(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; }
}

function dateHeure(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

function initiales(nom) {
  return String(nom || '?').split(/\s+/).slice(0, 2).map((m) => m[0] || '').join('').toUpperCase();
}

function e(chaine) {
  return String(chaine ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const LIBELLES_STATUT = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

function badgeStatut(statut) {
  return `<span class="badge-statut statut-${e(statut)}">${e(LIBELLES_STATUT[statut] || statut)}</span>`;
}

/* ============ Panier ============ */
function nbArticlesPanier() { return Etat.panier.reduce((s, l) => s + l.quantite, 0); }
function totalPanier() { return Etat.panier.reduce((s, l) => s + l.prix * l.quantite, 0); }

function ajouterAuPanier(produit, quantite = 1) {
  const ligne = Etat.panier.find((l) => l.produitId === produit.id);
  if (ligne) ligne.quantite += quantite;
  else {
    Etat.panier.push({
      produitId: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      image: produit.image,
      vendeurId: produit.vendeurId,
      ville: produit.ville,
      quantite,
      stock: produit.quantite,
    });
  }
  sauverPanier();
  toast(`« ${produit.nom} » ajouté au panier`, 'succes');
}

function majBadgePanier() {
  const badge = document.getElementById('badge-panier');
  if (!badge) return;
  const n = nbArticlesPanier();
  badge.textContent = n;
  badge.hidden = n === 0;
}

/* ============ Toasts ============ */
function toast(message, type = 'info') {
  const zone = document.getElementById('toast-zone');
  if (!zone) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  zone.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s ease';
    setTimeout(() => el.remove(), 320);
  }, 3400);
}

/* ============ Utilitaires vue ============ */
function imageOuPlaceholder(produit, classePlaceholder = 'carte-image-placeholder') {
  if (produit.image) {
    return `<img src="${e(produit.image)}" alt="${e(produit.nom)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'${classePlaceholder}\\'>${e(initiales(produit.categorie))}</div>'" />`;
  }
  return `<div class="${classePlaceholder}">${e(initiales(produit.categorie))}</div>`;
}

function carteProduitHtml(p) {
  const enRupture = p.quantite <= 0;
  return `
    <article class="carte-produit">
      <a class="carte-image" href="#/produit/${e(p.id)}">
        ${imageOuPlaceholder(p)}
        ${enRupture ? '<span class="etiquette" style="background:#d22b2b;color:#fff">Rupture</span>' : ''}
      </a>
      <div class="carte-corps">
        <span class="carte-categorie">${e(p.categorie)}</span>
        <a class="carte-titre" href="#/produit/${e(p.id)}">${e(p.nom)}</a>
        <div class="carte-prix">${fc(p.prix)}</div>
        <div class="carte-meta">
          <span>${e(p.ville)}</span>
          <span>${e(p.vendeur ? p.vendeur.nom : '')}</span>
        </div>
        <div class="carte-actions">
          <a class="btn btn-ghost btn-petit" href="#/produit/${e(p.id)}">Détails</a>
          <button class="btn btn-primaire btn-petit" data-ajouter-panier="${e(p.id)}" ${enRupture ? 'disabled' : ''}>Ajouter</button>
        </div>
      </div>
    </article>`;
}
