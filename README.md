# Bwaka.cd — La marketplace de la RDC 🇨🇩

Plateforme de vente en ligne en République Démocratique du Congo, **ouverte à toute personne qui veut vendre après s'être inscrite comme membre**.

Cette version utilise **Firebase** comme backend (authentification, base de données Firestore, stockage d'images) et peut être hébergée sur n'importe quel hébergement statique (Netlify, Firebase Hosting, GitHub Pages…). Il n'y a **plus de serveur Express** : le frontend appelle Firebase directement depuis le navigateur.

## Fonctionnalités

### Pour tous les visiteurs
- Parcourir le catalogue produits (recherche, catégories, villes, tri par prix)
- Voir le détail d'un produit et le profil du vendeur
- Panier d'achats et passage de commande
- Paiement : **M-Pesa, Orange Money, Airtel Money, Africell Money ou paiement à la livraison**

### Pour les membres (gratuit)
- Inscription / connexion sécurisée (Firebase Auth)
- **Espace vendeur ouvert à tous** : publier, modifier et supprimer des produits (avec photo)
- Tableau de bord : produits actifs, commandes reçues, chiffre d'affaires
- Gestion des commandes : confirmer, expédier, livrer, annuler (avec remise en stock)
- Suivi de ses propres achats : historique et statuts (en attente → confirmée → expédiée → livrée)

## Démarrage rapide

```bash
npm install
npm start
```

Ouvrez ensuite **http://localhost:3000**.

### 1. Configurer Firebase (obligatoire)

Le frontend appelle Firebase directement. Vous devez créer un projet Firebase et renseigner ses clés :

1. Créez un projet sur [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Ajoutez une application Web et copiez sa configuration (`firebaseConfig`)
3. Ouvrez `public/js/firebase-config.js` et remplacez les valeurs vides par vos clés :

```js
const firebaseConfig = {
  apiKey: 'VOTRE_API_KEY',
  authDomain: 'VOTRE_PROJET.firebaseapp.com',
  projectId: 'VOTRE_PROJET_ID',
  storageBucket: 'VOTRE_PROJET.appspot.com',
  messagingSenderId: '...',
  appId: '...',
};
```

4. Dans la console Firebase, activez **Authentification** > Méthode de connexion "E-mail/mot de passe".
5. Créez une base de données **Firestore** en mode test (ou déployez les règles fournies) :
   ```bash
   # Avec la Firebase CLI (optionnel) :
   firebase deploy --only firestore,storage
   ```
   Les fichiers `firestore.rules` et `storage.rules` contiennent les règles de sécurité.

### Test de rendu

```bash
node test-rendu.js   # vérifie le rendu des pages statiques (headless, jsdom)
```

**Nota** : ce test ne configure pas Firebase. Les pages qui appellent l'API (catalogue, produit, commande…) nécessitent un projet Firebase configuré pour fonctionner pleinement.

### Comptes de démonstration

Après avoir créé des comptes via l'interface d'inscription, ils sont stockés dans Firebase Auth + Firestore (collection `profils`). Il n'y a plus de comptes prédéfinis en dur.

## Architecture

```
server.js            → Serveur statique minimal (Node http) + SPA fallback
                     (sert public/ et renvoie index.html pour toute route inconnue)
public/              → Application web (SPA en français, sans framework)
  css/styles.css     → design system Bwaka
  js/referentiels.js → listes statiques (catégories, villes, moyens de paiement)
  js/firebase-config.js → initialisation Firebase (à configurer)
  js/core.js         → état, API façade vers Firestore/Auth/Storage, panier, formatage
  js/views.js        → pages (accueil, produit, panier, commande, vendeur…)
  js/app.js          → routeur + initialisation Firebase Auth
  images/            → visuels de démonstration
firestore.rules      → règles de sécurité Firestore
storage.rules        → règles de sécurité Firebase Storage
firebase.json        → configuration Firebase Hosting (optionnel)
lib/seed.js          → conservé comme référence des données de démo (non utilisé)
```

### Collections Firestore

| Collection | Description |
|------------|-------------|
| `profils` | Profils des utilisateurs (id = UID Firebase Auth) |
| `produits` | Catalogue produits (champ `vendeurId` pour le propriétaire) |
| `commandes` | Commandes (champs `acheteurId`, `vendeurIds[]`, `items[]`) |
| `compteurs` | Compteur global pour les numéros de commande |

Les règles de sécurité (`firestore.rules`) garantissent qu'un utilisateur ne peut lire/modifier que ses propres produits et commandes.

## Déploiement

### Netlify (hébergement statique)
Le fichier `netlify.toml` est déjà configuré : publiez le dossier `public/`, toutes les routes sont redirigées vers `index.html` (SPA). N'oubliez pas de configurer `public/js/firebase-config.js` avec vos clés Firebase.

### Firebase Hosting
```bash
firebase deploy
```
(fichier `firebase.json` déjà présent)

## Paiements

Les montants sont en **francs congolais (FC)**. Les moyens de paiement sont déclaratifs : M-Pesa, Orange Money, Airtel Money, Africell Money ou paiement à la livraison. L'intégration effective avec les opérateurs mobile money est à prévoir selon le prestataire de paiement choisi.
