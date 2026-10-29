'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const db = require('./lib/db');
const auth = require('./lib/auth');
const { CATEGORIES, METHODES_PAIEMENT, VILLES } = require('./lib/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Upload d'images ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  },
});

// ---------- Helpers ----------
function publicUser(u) {
  const { motDePasse, ...reste } = u;
  return reste;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = auth.verifyToken(token);
  if (!payload) return res.status(401).json({ erreur: 'Connexion requise' });
  const utilisateur = db.get().utilisateurs.find((u) => u.id === payload.uid);
  if (!utilisateur) return res.status(401).json({ erreur: 'Compte introuvable' });
  req.utilisateur = utilisateur;
  next();
}

function findProduit(id) {
  return db.get().produits.find((p) => p.id === id);
}

function vendeurPublic(id) {
  const u = db.get().utilisateurs.find((x) => x.id === id);
  return u ? { id: u.id, nom: u.nom, ville: u.ville, telephone: u.telephone, membreDepuis: u.createdAt } : null;
}

function produitComplet(p) {
  return { ...p, vendeur: vendeurPublic(p.vendeurId) };
}

// ---------- Référentiels ----------
app.get('/api/referentiels', (req, res) => {
  res.json({ categories: CATEGORIES, methodesPaiement: METHODES_PAIEMENT, villes: VILLES });
});

// ---------- Auth ----------
app.post('/api/auth/inscription', (req, res) => {
  const { nom, email, telephone, ville, motDePasse } = req.body || {};
  if (!nom || !email || !telephone || !ville || !motDePasse) {
    return res.status(400).json({ erreur: 'Tous les champs sont obligatoires' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erreur: 'Adresse e-mail invalide' });
  }
  if (String(motDePasse).length < 6) {
    return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 6 caractères' });
  }
  const data = db.get();
  const emailNorm = String(email).trim().toLowerCase();
  if (data.utilisateurs.some((u) => u.email.toLowerCase() === emailNorm)) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec cet e-mail' });
  }
  const utilisateur = {
    id: db.id('u'),
    nom: String(nom).trim(),
    email: emailNorm,
    telephone: String(telephone).trim(),
    ville: String(ville).trim(),
    motDePasse: auth.hashPassword(String(motDePasse)),
    createdAt: new Date().toISOString(),
  };
  data.utilisateurs.push(utilisateur);
  db.save();
  res.status(201).json({
    token: auth.signToken({ uid: utilisateur.id }),
    utilisateur: publicUser(utilisateur),
  });
});

app.post('/api/auth/connexion', (req, res) => {
  const { email, motDePasse } = req.body || {};
  const data = db.get();
  const utilisateur = data.utilisateurs.find(
    (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase()
  );
  if (!utilisateur || !auth.verifyPassword(String(motDePasse || ''), utilisateur.motDePasse)) {
    return res.status(401).json({ erreur: 'E-mail ou mot de passe incorrect' });
  }
  res.json({
    token: auth.signToken({ uid: utilisateur.id }),
    utilisateur: publicUser(utilisateur),
  });
});

app.get('/api/auth/moi', requireAuth, (req, res) => {
  res.json({ utilisateur: publicUser(req.utilisateur) });
});

// ---------- Produits ----------
app.get('/api/produits', (req, res) => {
  const { q, categorie, ville, vendeur, tri } = req.query;
  let liste = db.get().produits.filter((p) => p.statut === 'actif');

  if (q) {
    const terme = String(q).toLowerCase();
    liste = liste.filter(
      (p) =>
        p.nom.toLowerCase().includes(terme) ||
        p.description.toLowerCase().includes(terme) ||
        p.categorie.toLowerCase().includes(terme)
    );
  }
  if (categorie) liste = liste.filter((p) => p.categorie === categorie);
  if (ville) liste = liste.filter((p) => p.ville === ville);
  if (vendeur) liste = liste.filter((p) => p.vendeurId === vendeur);

  liste = [...liste].sort((a, b) => {
    if (tri === 'prix_asc') return a.prix - b.prix;
    if (tri === 'prix_desc') return b.prix - a.prix;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({ produits: liste.map(produitComplet) });
});

app.get('/api/produits/:id', (req, res) => {
  const p = findProduit(req.params.id);
  if (!p) return res.status(404).json({ erreur: 'Produit introuvable' });
  res.json({ produit: produitComplet(p) });
});

app.post('/api/produits', requireAuth, (req, res) => {
  const { nom, description, prix, categorie, quantite, ville, image } = req.body || {};
  if (!nom || !description || !prix || !categorie || !ville) {
    return res.status(400).json({ erreur: 'Nom, description, prix, catégorie et ville sont obligatoires' });
  }
  const prixNum = Number(prix);
  if (!Number.isFinite(prixNum) || prixNum <= 0) {
    return res.status(400).json({ erreur: 'Le prix doit être un nombre positif' });
  }
  const produit = {
    id: db.id('p'),
    nom: String(nom).trim(),
    description: String(description).trim(),
    prix: Math.round(prixNum),
    categorie: String(categorie),
    quantite: Math.max(1, Number(quantite) || 1),
    image: image ? String(image) : null,
    vendeurId: req.utilisateur.id,
    ville: String(ville).trim(),
    statut: 'actif',
    createdAt: new Date().toISOString(),
  };
  db.get().produits.push(produit);
  db.save();
  res.status(201).json({ produit: produitComplet(produit) });
});

app.put('/api/produits/:id', requireAuth, (req, res) => {
  const p = findProduit(req.params.id);
  if (!p) return res.status(404).json({ erreur: 'Produit introuvable' });
  if (p.vendeurId !== req.utilisateur.id) {
    return res.status(403).json({ erreur: 'Vous ne pouvez modifier que vos propres produits' });
  }
  const champs = ['nom', 'description', 'categorie', 'ville', 'image'];
  for (const c of champs) {
    if (req.body[c] !== undefined) p[c] = String(req.body[c]);
  }
  if (req.body.prix !== undefined) {
    const prixNum = Number(req.body.prix);
    if (!Number.isFinite(prixNum) || prixNum <= 0) {
      return res.status(400).json({ erreur: 'Le prix doit être un nombre positif' });
    }
    p.prix = Math.round(prixNum);
  }
  if (req.body.quantite !== undefined) p.quantite = Math.max(0, Number(req.body.quantite) || 0);
  if (req.body.statut === 'actif' || req.body.statut === 'inactif') p.statut = req.body.statut;
  db.save();
  res.json({ produit: produitComplet(p) });
});

app.delete('/api/produits/:id', requireAuth, (req, res) => {
  const data = db.get();
  const index = data.produits.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ erreur: 'Produit introuvable' });
  if (data.produits[index].vendeurId !== req.utilisateur.id) {
    return res.status(403).json({ erreur: 'Vous ne pouvez supprimer que vos propres produits' });
  }
  data.produits.splice(index, 1);
  db.save();
  res.json({ ok: true });
});

// ---------- Upload ----------
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ erreur: 'Aucune image reçue' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Commandes ----------
app.post('/api/commandes', requireAuth, (req, res) => {
  const { items, adresse, methodePaiement } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erreur: 'Votre panier est vide' });
  }
  if (!adresse || !adresse.nom || !adresse.telephone || !adresse.ville || !adresse.quartier) {
    return res.status(400).json({ erreur: 'Veuillez compléter l’adresse de livraison' });
  }
  if (!METHODES_PAIEMENT.includes(methodePaiement)) {
    return res.status(400).json({ erreur: 'Méthode de paiement invalide' });
  }

  const data = db.get();
  const lignes = [];
  for (const item of items) {
    const p = findProduit(item.produitId);
    if (!p || p.statut !== 'actif') {
      return res.status(400).json({ erreur: `Produit indisponible : ${item.produitId}` });
    }
    const quantite = Math.max(1, Number(item.quantite) || 1);
    if (p.quantite < quantite) {
      return res.status(400).json({ erreur: `Stock insuffisant pour « ${p.nom} »` });
    }
    lignes.push({
      produitId: p.id,
      nom: p.nom,
      prix: p.prix,
      image: p.image,
      quantite,
      vendeurId: p.vendeurId,
    });
  }

  // Décrémenter le stock
  for (const ligne of lignes) {
    const p = findProduit(ligne.produitId);
    p.quantite -= ligne.quantite;
    if (p.quantite <= 0) p.statut = 'inactif';
  }

  data.compteurs.commande += 1;
  const commande = {
    id: db.id('c'),
    numero: `BWK-${new Date().getFullYear()}-${String(data.compteurs.commande).padStart(4, '0')}`,
    acheteurId: req.utilisateur.id,
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
  };
  data.commandes.push(commande);
  db.save();
  res.status(201).json({ commande });
});

app.get('/api/commandes', requireAuth, (req, res) => {
  const liste = db
    .get()
    .commandes.filter((c) => c.acheteurId === req.utilisateur.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ commandes: liste });
});

app.get('/api/ventes', requireAuth, (req, res) => {
  const uid = req.utilisateur.id;
  const ventes = db
    .get()
    .commandes.filter((c) => c.items.some((i) => i.vendeurId === uid))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => i.vendeurId === uid),
    }));
  res.json({ ventes });
});

const TRANSITIONS = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

app.patch('/api/commandes/:id/statut', requireAuth, (req, res) => {
  const data = db.get();
  const commande = data.commandes.find((c) => c.id === req.params.id);
  if (!commande) return res.status(404).json({ erreur: 'Commande introuvable' });

  const nouveau = req.body.statut;
  const acheteur = commande.acheteurId === req.utilisateur.id;
  const vendeur = commande.items.some((i) => i.vendeurId === req.utilisateur.id);
  if (!acheteur && !vendeur) {
    return res.status(403).json({ erreur: 'Accès refusé' });
  }

  // L'acheteur ne peut que annuler une commande en attente
  if (acheteur && !vendeur && nouveau !== 'annulee') {
    return res.status(403).json({ erreur: 'Seul le vendeur peut mettre à jour le statut' });
  }
  if (!TRANSITIONS[commande.statut] || !TRANSITIONS[commande.statut].includes(nouveau)) {
    return res.status(400).json({ erreur: `Transition impossible : ${commande.statut} → ${nouveau}` });
  }

  commande.statut = nouveau;

  // Annulation → remise en stock
  if (nouveau === 'annulee') {
    for (const ligne of commande.items) {
      const p = findProduit(ligne.produitId);
      if (p) {
        p.quantite += ligne.quantite;
        if (p.statut === 'inactif' && p.quantite > 0) p.statut = 'actif';
      }
    }
  }
  db.save();
  res.json({ commande });
});

// ---------- Statistiques vendeur ----------
app.get('/api/stats', requireAuth, (req, res) => {
  const uid = req.utilisateur.id;
  const data = db.get();
  const mesProduits = data.produits.filter((p) => p.vendeurId === uid);
  const mesVentes = data.commandes.filter((c) => c.items.some((i) => i.vendeurId === uid));
  const chiffreAffaires = mesVentes
    .filter((c) => c.statut !== 'annulee')
    .reduce((s, c) => s + c.items.filter((i) => i.vendeurId === uid).reduce((t, i) => t + i.prix * i.quantite, 0), 0);
  res.json({
    produitsActifs: mesProduits.filter((p) => p.statut === 'actif').length,
    totalProduits: mesProduits.length,
    ventes: mesVentes.length,
    chiffreAffaires,
  });
});

app.use('/api', (req, res) => res.status(404).json({ erreur: 'Route inconnue' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bwaka Marketplace démarré sur http://0.0.0.0:${PORT}`);
});
