# Bwaka.cd — La marketplace de la RDC 🇨🇩

Plateforme de vente en ligne en République Démocratique du Congo, **ouverte à toute personne qui veut vendre après s'être inscrite comme membre**.

Cette version utilise **Firebase (`bwaka-ac664`)** comme backend (authentification, base de données Cloud Firestore, stockage d'images avec repli automatique) et fonctionne sur n'importe quel hébergement statique (**Netlify**, **Firebase Hosting**, **GitHub Pages**…). Il n'y a **plus de serveur Express** : le navigateur communique directement avec Firebase.

## Fonctionnalités

### Pour tous les visiteurs
- Parcourir le catalogue produits (recherche, catégories, villes, tri par prix)
- Voir le détail d'un produit et le profil du vendeur
- Panier d'achats et passage de commande
- Paiement : **M-Pesa, Orange Money, Airtel Money, Africell Money ou paiement à la livraison**

### Pour les membres (gratuit)
- Inscription / connexion sécurisée (Firebase Authentication)
- **Espace vendeur ouvert à tous** : publier, modifier et supprimer des produits (avec photo)
- Import en 1 clic des **12 produits de démonstration** RDC lorsque le catalogue est vide
- Tableau de bord vendeur : produits actifs, commandes reçues, chiffre d'affaires
- Gestion des commandes : confirmer, expédier, livrer, annuler (avec remise en stock transactionnelle)
- Suivi de ses propres achats : historique et statuts (`en_attente` → `confirmee` → `expediee` → `livree`)

## Démarrage rapide

```bash
npm install
npm start
```

Ouvrez ensuite **http://localhost:3000**.

## Configuration du projet Firebase (`bwaka-ac664`)

Les clés publiques du projet `bwaka-ac664` sont déjà renseignées dans `public/js/firebase-config.js`.
Assurez-vous dans la [Console Firebase (`bwaka-ac664`)](https://console.firebase.google.com/project/bwaka-ac664) que :

1. **Authentication** → *Sign-in method* → **Adresse e-mail / mot de passe** est **activé**.
2. **Firestore Database** est **créée** et ses règles correspondent à `firestore.rules` (copiez-collez le contenu de `firestore.rules` dans l'onglet *Règles*, ou exécutez `firebase deploy --only firestore:rules`).
3. *(Optionnel)* **Storage** : si Firebase Storage est activé, les images sont stockées dans `uploads/` (`storage.rules`). Sur le plan gratuit Spark sans Storage, les images sont automatiquement compressées côté navigateur (JPEG léger) afin que la publication d'annonces avec photo fonctionne sans carte bancaire.

### Tests automatisés

```bash
npm test   # vérifie le chargement du SDK Firebase 11.4.0 et tout le parcours E2E (auth, produits, panier, commandes, ventes)
```

## Architecture

```
server.js              → Serveur statique minimal (Node http) + SPA fallback
netlify.toml           → Configuration Netlify (publish = "public" + redirection SPA)
firebase.json          → Configuration Firebase Hosting, Firestore et Storage
.firebaserc            → Projet Firebase par défaut (bwaka-ac664)
firestore.rules        → Règles de sécurité Cloud Firestore
firestore.indexes.json → Configuration d'index Firestore
storage.rules          → Règles de sécurité Firebase Storage
public/                → Application web (SPA en français, sans bundler)
  css/styles.css       → Design system Bwaka
  js/firebase-config.js→ Initialisation Firebase (projet bwaka-ac664)
  js/referentiels.js   → Catégories, villes, paiements et catalogue de démo RDC
  js/core.js           → État, façade API vers Auth/Firestore/Storage, panier, formatage FC
  js/views.js          → Vues (accueil, produit, panier, commande, vendeur, ventes…)
  js/app.js            → Routeur client (#/) + écouteur Firebase Auth
  images/              → Visuels de démonstration
```

### Collections Firestore

| Collection | Description |
|------------|-------------|
| `profils` | Profils des membres (`id` = UID Firebase Auth) |
| `produits` | Catalogue produits (`vendeurId`, `statut`, `quantite`, `prix` en FC…) |
| `commandes` | Commandes (`acheteurId`, `vendeurIds[]`, `items[]`, transactions de stock) |
| `compteurs` | Compteur transactionnel (`global`) pour les numéros `BWK-AAAA-NNNN` |
