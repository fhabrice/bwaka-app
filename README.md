# Bwaka.cd — La marketplace de la RDC 🇨🇩

Plateforme de vente en ligne en République Démocratique du Congo, **ouverte à toute personne qui veut vendre après s'être inscrite comme membre**.

## Fonctionnalités

### Pour tous les visiteurs
- Parcourir le catalogue produits (recherche, catégories, villes, tri par prix)
- Voir le détail d'un produit et le profil du vendeur
- Panier d'achats et passage de commande
- Paiement : **M-Pesa, Orange Money, Airtel Money, Africell Money ou paiement à la livraison**

### Pour les membres (gratuit)
- Inscription / connexion sécurisée (mots de passe hashés, jetons signés)
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

### Comptes de démonstration
Mot de passe commun : `demo123`

| E-mail             | Ville    |
|--------------------|----------|
| jean@bwaka.cd      | Goma     |
| grace@bwaka.cd     | Kinshasa |
| esperance@bwaka.cd | Bukavu   |

## Architecture

```
server.js          → API Express (auth, produits, commandes, ventes, upload)
lib/auth.js        → hashage scrypt + jetons HMAC
lib/db.js          → persistance JSON (data/db.json, générée automatiquement)
lib/seed.js        → données de démonstration + référentiels
public/            → application web (SPA en français, sans framework)
  css/styles.css   → design system Bwaka
  js/core.js       → état, API, panier, formatage FC
  js/views.js      → pages (accueil, produit, panier, commande, vendeur…)
  js/app.js        → routeur + interactions
  images/          → visuels de démonstration
```

## API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/inscription` | Créer un compte membre |
| POST | `/api/auth/connexion` | Se connecter |
| GET | `/api/produits` | Catalogue (filtres `q`, `categorie`, `ville`, `vendeur`, `tri`) |
| POST | `/api/produits` | Publier un produit *(membre)* |
| PUT/DELETE | `/api/produits/:id` | Gérer son produit *(membre)* |
| POST | `/api/upload` | Téléverser une image *(membre)* |
| POST | `/api/commandes` | Passer commande *(membre)* |
| GET | `/api/commandes` | Mes commandes *(membre)* |
| GET | `/api/ventes` | Mes ventes *(vendeur)* |
| PATCH | `/api/commandes/:id/statut` | Mettre à jour le statut |
| GET | `/api/stats` | Statistiques vendeur |

Les montants sont en **francs congolais (FC)**. La base de données est stockée dans `data/db.json` (fichier JSON, idéal pour la démonstration).
