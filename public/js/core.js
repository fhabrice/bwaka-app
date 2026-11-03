'use strict';

/* ============ État global ============ */
const Etat = {
  token: localStorage.getItem('bwaka_token') || null,
  utilisateur: JSON.parse(localStorage.getItem('bwaka_utilisateur') || 'null'),
  panier: JSON.parse(localStorage.getItem('bwaka_panier') || '[]'),
  referentiels: { categories: [], methodesPaiement: [], villes: [] },
};

function sauverSession() {
  if (Etat.token) {
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

/* ============ Helpers Firestore ============ */
function colProduits() { return collection(window.db, 'produits'); }
function colCommandes() { return collection(window.db, 'commandes'); }
function colProfils() { return collection(window.db, 'profils'); }

function erreurFirebase(err, statutParDefaut = 500) {
  const e = new Error(err.message || 'Erreur inconnue');
  e.status = err.status || statutParDefaut;
  return e;
}

/* ============ API (façade compatible avec l'ancienne interface /api/*) ============ */
async function api(chemin, options = {}) {
  const entetes = { ...(options.entetes || {}) };
  if (options.corps && !(options.corps instanceof FormData)) {
    entetes['Content-Type'] = 'application/json';
    options = { ...options, corps: JSON.stringify(options.corps) };
  }
  if (Etat.token) entetes['Authorization'] = `Bearer ${Etat.token}`;

  let url = chemin;
  let query = {};
  if (typeof url === 'string' && url.includes('?')) {
    const parties = url.split('?');
    url = parties[0];
    query = new URLSearchParams(parties[1]);
  }

  try {
    // ---------- Referentiels ----------
    if (url === '/api/referentiels') {
      return { ...chargerReferentiels() };
    }

    // ---------- Auth ----------
    if (url === '/api/auth/inscription' && (options.method || 'GET') === 'POST') {
      const body = options.corps ? JSON.parse(options.corps) : {};
      const { nom, email, telephone, ville, motDePasse } = body;
      if (!nom || !email || !telephone || !ville || !motDePasse) {
        throw Object.assign(new Error('Tous les champs sont obligatoires'), { status: 400 });
      }
      const cred = await createUserWithEmailAndPassword(window.auth, email, motDePasse);
      const user = cred.user;
      const profil = {
        id: user.uid,
        nom: String(nom).trim(),
        email: String(email).trim().toLowerCase(),
        telephone: String(telephone).trim(),
        ville: String(ville).trim(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(window.db, 'profils', user.uid), profil);
      const token = await user.getIdToken();
      Etat.token = token;
      Etat.utilisateur = profil;
      sauverSession();
      return { token, utilisateur: profil };
    }

    if (url === '/api/auth/connexion' && (options.method || 'GET') === 'POST') {
      const body = options.corps ? JSON.parse(options.corps) : {};
      const { email, motDePasse } = body;
      const cred = await signInWithEmailAndPassword(window.auth, email, motDePasse);
      const user = cred.user;
      const snap = await getDoc(doc(window.db, 'profils', user.uid));
      if (!snap.exists()) throw Object.assign(new Error('Profil introuvable'), { status: 404 });
      const profil = snap.data();
      const token = await user.getIdToken();
      Etat.token = token;
      Etat.utilisateur = profil;
      sauverSession();
      return { token, utilisateur: profil };
    }

    if (url === '/api/auth/moi') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Non connecté'), { status: 401 });
      const snap = await getDoc(doc(window.db, 'profils', user.uid));
      if (!snap.exists()) throw Object.assign(new Error('Profil introuvable'), { status: 404 });
      return { utilisateur: snap.data() };
    }

    // ---------- Produits ----------
    if (url === '/api/produits' && (options.method || 'GET') === 'GET') {
      const q = query.get('q');
      const categorie = query.get('categorie');
      const ville = query.get('ville');
      const vendeur = query.get('vendeur');
      const tri = query.get('tri');

      let qRef = query(colProduits(), where('statut', '==', 'actif'));
      if (categorie) qRef = query(qRef, where('categorie', '==', categorie));
      if (ville) qRef = query(qRef, where('ville', '==', ville));
      if (vendeur) qRef = query(qRef, where('vendeurId', '==', vendeur));
      if (tri === 'prix_asc') qRef = query(qRef, orderBy('prix', 'asc'));
      else if (tri === 'prix_desc') qRef = query(qRef, orderBy('prix', 'desc'));
      else qRef = query(qRef, orderBy('createdAt', 'desc'));

      const snap = await getDocs(qRef);
      let liste = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (q) {
        const terme = String(q).toLowerCase();
        liste = liste.filter(p =>
          String(p.nom || '').toLowerCase().includes(terme) ||
          String(p.description || '').toLowerCase().includes(terme) ||
          String(p.categorie || '').toLowerCase().includes(terme)
        );
      }

      const listeComplète = [];
      for (const p of liste) {
        listeComplète.push(await produitComplet(p));
      }
      return { produits: listeComplète };
    }

    if (url.match(/^\/api\/produits\/([^/]+)$/) && (options.method || 'GET') === 'GET') {
      const id = url.match(/^\/api\/produits\/([^/]+)$/)[1];
      const snap = await getDoc(doc(window.db, 'produits', id));
      if (!snap.exists()) throw Object.assign(new Error('Produit introuvable'), { status: 404 });
      return { produit: await produitComplet({ id: snap.id, ...snap.data() }) };
    }

    if (url === '/api/produits' && (options.method || 'GET') === 'POST') {
      const body = options.corps ? JSON.parse(options.corps) : {};
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });

      const { nom, description, prix, categorie, quantite, ville, image } = body;
      if (!nom || !description || !prix || !categorie || !ville) {
        throw Object.assign(new Error('Nom, description, prix, catégorie et ville sont obligatoires'), { status: 400 });
      }
      const prixNum = Number(prix);
      if (!Number.isFinite(prixNum) || prixNum <= 0) {
        throw Object.assign(new Error('Le prix doit être un nombre positif'), { status: 400 });
      }
      const produit = {
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
      const ref = await addDoc(colProduits(), produit);
      const produitAvecId = { id: ref.id, ...produit };
      return { produit: await produitComplet(produitAvecId) };
    }

    if (url.match(/^\/api\/produits\/([^/]+)$/) && (options.method || 'GET') === 'PUT') {
      const id = url.match(/^\/api\/produits\/([^/]+)$/)[1];
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });

      const snap = await getDoc(doc(window.db, 'produits', id));
      if (!snap.exists()) throw Object.assign(new Error('Produit introuvable'), { status: 404 });
      const p = snap.data();
      if (p.vendeurId !== user.uid) throw Object.assign(new Error('Vous ne pouvez modifier que vos propres produits'), { status: 403 });

      const body = options.corps ? JSON.parse(options.corps) : {};
      const misesAJour = {};
      const champs = ['nom', 'description', 'categorie', 'ville', 'image'];
      for (const c of champs) {
        if (body[c] !== undefined) misesAJour[c] = String(body[c]);
      }
      if (body.prix !== undefined) {
        const prixNum = Number(body.prix);
        if (!Number.isFinite(prixNum) || prixNum <= 0) throw Object.assign(new Error('Le prix doit être un nombre positif'), { status: 400 });
        misesAJour.prix = Math.round(prixNum);
      }
      if (body.quantite !== undefined) misesAJour.quantite = Math.max(0, Number(body.quantite) || 0);
      if (body.statut === 'actif' || body.statut === 'inactif') misesAJour.statut = body.statut;

      await updateDoc(doc(window.db, 'produits', id), misesAJour);
      const snap2 = await getDoc(doc(window.db, 'produits', id));
      return { produit: await produitComplet({ id: snap2.id, ...snap2.data() }) };
    }

    if (url.match(/^\/api\/produits\/([^/]+)$/) && (options.method || 'GET') === 'DELETE') {
      const id = url.match(/^\/api\/produits\/([^/]+)$/)[1];
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });

      const snap = await getDoc(doc(window.db, 'produits', id));
      if (!snap.exists()) throw Object.assign(new Error('Produit introuvable'), { status: 404 });
      if (snap.data().vendeurId !== user.uid) throw Object.assign(new Error('Vous ne pouvez supprimer que vos propres produits'), { status: 403 });

      await deleteDoc(doc(window.db, 'produits', id));
      return { ok: true };
    }

    // ---------- Upload ----------
    if (url === '/api/upload' && (options.method || 'GET') === 'POST') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
      const file = options.corps instanceof FormData ? options.corps.get('image') : null;
      if (!file) throw Object.assign(new Error('Aucune image reçue'), { status: 400 });
      if (!file.type || !/^image\//.test(file.type)) throw Object.assign(new Error('Seules les images sont acceptées'), { status: 400 });

      const nomFichier = file.name || 'image.jpg';
      const point = nomFichier.lastIndexOf('.');
      const ext = point >= 0 ? nomFichier.slice(point).toLowerCase() : '.jpg';
      const refStorage = ref(window.storage, `uploads/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`);
      await uploadBytes(refStorage, file);
      const urlDownload = await getDownloadURL(refStorage);
      return { url: urlDownload };
    }

    // ---------- Commandes ----------
    if (url === '/api/commandes' && (options.method || 'GET') === 'POST') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
      const body = options.corps ? JSON.parse(options.corps) : {};
      const { items, adresse, methodePaiement } = body;

      if (!Array.isArray(items) || items.length === 0) throw Object.assign(new Error('Votre panier est vide'), { status: 400 });
      if (!adresse || !adresse.nom || !adresse.telephone || !adresse.ville || !adresse.quartier) throw Object.assign(new Error('Veuillez compléter l’adresse de livraison'), { status: 400 });
      if (!Referentiels.methodesPaiement.includes(methodePaiement)) throw Object.assign(new Error('Méthode de paiement invalide'), { status: 400 });

      const lignes = [];
      const vendeurIds = new Set();
      for (const item of items) {
        const snap = await getDoc(doc(window.db, 'produits', item.produitId));
        if (!snap.exists()) throw Object.assign(new Error(`Produit indisponible : ${item.produitId}`), { status: 400 });
        const p = snap.data();
        if (p.statut !== 'actif') throw Object.assign(new Error(`Produit indisponible : ${item.produitId}`), { status: 400 });
        const quantite = Math.max(1, Number(item.quantite) || 1);
        if (p.quantite < quantite) throw Object.assign(new Error(`Stock insuffisant pour « ${p.nom} »`), { status: 400 });
        lignes.push({
          produitId: p.id,
          nom: p.nom,
          prix: p.prix,
          image: p.image,
          quantite,
          vendeurId: p.vendeurId,
        });
        vendeurIds.add(p.vendeurId);
      }

      // Décrémenter le stock (transaction)
      for (const ligne of lignes) {
        const produitRef = doc(window.db, 'produits', ligne.produitId);
        await runTransaction(window.db, async (tx) => {
          const snap = await tx.get(produitRef);
          const p = snap.data();
          const nouvelleQte = Math.max(0, (p.quantite || 0) - ligne.quantite);
          const misesAJour = { quantite: nouvelleQte };
          if (nouvelleQte <= 0) misesAJour.statut = 'inactif';
          tx.update(produitRef, misesAJour);
        });
      }

      const compteurSnap = await getDoc(doc(window.db, 'compteurs', 'global'));
      let numeroCommande = 1;
      if (compteurSnap.exists()) {
        numeroCommande = (compteurSnap.data().commande || 0) + 1;
        await updateDoc(doc(window.db, 'compteurs', 'global'), { commande: numeroCommande });
      } else {
        await setDoc(doc(window.db, 'compteurs', 'global'), { commande: 1 });
      }

      const commande = {
        id: null,
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

      const ref = await addDoc(colCommandes(), commande);
      commande.id = ref.id;
      return { commande };
    }

    if (url === '/api/commandes' && (options.method || 'GET') === 'GET') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
      const qRef = query(colCommandes(), where('acheteurId', '==', user.uid));
      const snap = await getDocs(qRef);
      const liste = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { commandes: liste };
    }

    if (url === '/api/ventes' && (options.method || 'GET') === 'GET') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
      const qRef = query(colCommandes(), where('vendeurIds', 'array-contains', user.uid));
      const snap = await getDocs(qRef);
      const ventes = snap.docs
        .map(d => ({ id: d.id, ...d.data(), items: (d.data().items || []).filter(i => i.vendeurId === user.uid) }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { ventes };
    }

    if (url.match(/^\/api\/commandes\/([^/]+)\/statut$/) && (options.method || 'GET') === 'PATCH') {
      const id = url.match(/^\/api\/commandes\/([^/]+)\/statut$/)[1];
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
      const body = options.corps ? JSON.parse(options.corps) : {};
      const nouveau = body.statut;

      const snap = await getDoc(doc(window.db, 'commandes', id));
      if (!snap.exists()) throw Object.assign(new Error('Commande introuvable'), { status: 404 });
      const commande = snap.data();
      const acheteur = commande.acheteurId === user.uid;
      const vendeur = commande.vendeurIds && commande.vendeurIds.includes(user.uid);
      if (!acheteur && !vendeur) throw Object.assign(new Error('Accès refusé'), { status: 403 });

      const TRANSITIONS = {
        en_attente: ['confirmee', 'annulee'],
        confirmee: ['expediee', 'annulee'],
        expediee: ['livree'],
        livree: [],
        annulee: [],
      };

      if (acheteur && !vendeur && nouveau !== 'annulee') throw Object.assign(new Error('Seul le vendeur peut mettre à jour le statut'), { status: 403 });
      if (!TRANSITIONS[commande.statut] || !TRANSITIONS[commande.statut].includes(nouveau)) throw Object.assign(new Error(`Transition impossible : ${commande.statut} → ${nouveau}`), { status: 400 });

      const misesAJour = { statut: nouveau };
      if (nouveau === 'annulee') {
        for (const ligne of commande.items) {
          const produitRef = doc(window.db, 'produits', ligne.produitId);
          await runTransaction(window.db, async (tx) => {
            const psnap = await tx.get(produitRef);
            const p = psnap.data();
            const nouvelleQte = (p.quantite || 0) + ligne.quantite;
            const m = { quantite: nouvelleQte };
            if (p.statut === 'inactif' && nouvelleQte > 0) m.statut = 'actif';
            tx.update(produitRef, m);
          });
        }
      }

      await updateDoc(doc(window.db, 'commandes', id), misesAJour);
      const snap2 = await getDoc(doc(window.db, 'commandes', id));
      return { commande: { id: snap2.id, ...snap2.data() } };
    }

    // ---------- Stats ----------
    if (url === '/api/stats' && (options.method || 'GET') === 'GET') {
      const user = window.auth.currentUser;
      if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });

      const mesProduitsSnap = await getDocs(query(colProduits(), where('vendeurId', '==', user.uid)));
      const mesProduits = mesProduitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const mesVentesSnap = await getDocs(query(colCommandes(), where('vendeurIds', 'array-contains', user.uid)));
      const mesVentes = mesVentesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const chiffreAffaires = mesVentes
        .filter(c => c.statut !== 'annulee')
        .reduce((s, c) => s + (c.items || [])
          .filter(i => i.vendeurId === user.uid)
          .reduce((t, i) => t + i.prix * i.quantite, 0), 0);

      return {
        produitsActifs: mesProduits.filter(p => p.statut === 'actif').length,
        totalProduits: mesProduits.length,
        ventes: mesVentes.length,
        chiffreAffaires,
      };
    }

    throw Object.assign(new Error('Route inconnue'), { status: 404 });
  } catch (err) {
    throw erreurFirebase(err);
  }
}

/* ============ Helpers ============ */
async function vendeurPublic(uid) {
  const snap = await getDoc(doc(window.db, 'profils', uid));
  if (!snap.exists()) return null;
  const u = snap.data();
  return { id: u.id, nom: u.nom, ville: u.ville, telephone: u.telephone, membreDepuis: u.createdAt };
}

async function produitComplet(p) {
  return { ...p, vendeur: await vendeurPublic(p.vendeurId) };
}

/* ============ Formatage ============ */
function fc(montant) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FC';
}

function dateCourte(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; }
}

function dateHeure(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

function initiales(nom) {
  return String(nom || '?').split(/\s+/).slice(0, 2).map(m => m[0] || '').join('').toUpperCase();
}

function e(chaine) {
  return String(chaine ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const LIBELLES_STATUT = {
  en_attente: 'En attente', confirmee: 'Confirmée', expediee: 'Expédiée',
  livree: 'Livrée', annulee: 'Annulée',
};

function badgeStatut(statut) {
  return `<span class="badge-statut statut-${e(statut)}">${e(LIBELLES_STATUT[statut] || statut)}</span>`;
}

/* ============ Panier ============ */
function nbArticlesPanier() { return Etat.panier.reduce((s, l) => s + l.quantite, 0); }
function totalPanier() { return Etat.panier.reduce((s, l) => s + l.prix * l.quantite, 0); }

function ajouterAuPanier(produit, quantite = 1) {
  const ligne = Etat.panier.find(l => l.produitId === produit.id);
  if (ligne) ligne.quantite += quantite;
  else {
    Etat.panier.push({
      produitId: produit.id, nom: produit.nom, prix: produit.prix, image: produit.image,
      vendeurId: produit.vendeurId, ville: produit.ville, quantite, stock: produit.quantite,
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
