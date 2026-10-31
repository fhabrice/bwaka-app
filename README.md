# BWAKA — la marketplace de confiance de la RDC 🇨🇩

> « Le commerce en ligne, enfin pensé pour la RDC. »
> Une seule application pour **vendre, payer en mobile money, livrer et être payé en toute
> confiance** — construite autour des réalités congolaises : téléphone d’abord, réseau instable,
> paiement mobile.

Application **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4**, adossée à
**Supabase** (PostgreSQL, Auth, Storage) pour le back-end.

---

## 1. Ce que fait l’application

Trois espaces réunis dans un seul produit :

| Espace | Fonctions |
| --- | --- |
| **Acheteur** | Catalogue filtrable (recherche, catégorie, ville, tri prix), fiche produit avec avis vérifiés, panier multi-boutiques, adresse + quartier, choix Mobile Money / paiement à la livraison, suivi de commande en 4 étapes, confirmation de réception par code à 6 chiffres, litige et remboursement |
| **Vendeur** | Ouverture de boutique en ligne, publication / modification / suppression de produits, stock, mise en avant, commandes reçues et transitions de statut (confirmer → remettre au livreur → livrée), chiffre d’affaires et commission, note de la boutique |
| **Livreur** | Missions disponibles en temps réel, prise de mission, démarrage de course, confirmation de livraison, revenus et tarif garanti |
| **Back-office** | Volume d’affaires, commissions, fonds en séquestre, utilisateurs, catalogue, vérification des vendeurs, traitement des litiges, flotte de livraison, projection de revenus (12 mois) |

Le cœur du modèle : **le séquestre**. L’argent du client est bloqué à la commande et n’est versé au
vendeur qu’après confirmation de réception. La commission BWAKA (4 %) est calculée automatiquement.

---

## 2. Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:3000
```

L’application démarre **en mode démonstration** si aucune variable Supabase n’est fournie : les
données de test (6 profils, 3 boutiques, 12 produits, 3 commandes) sont chargées en mémoire.

### Comptes de démonstration

Mot de passe commun : **`demo123`**

| E-mail | Rôle | Ville |
| --- | --- | --- |
| `acheteur@bwaka.cd` | Acheteur | Goma |
| `vendeur@bwaka.cd` | Vendeur (Volcan Tech) | Goma |
| `grace@bwaka.cd` | Vendeur (Kitoko Mode) | Kinshasa |
| `esperance@bwaka.cd` | Vendeur (Kivu Terroir) | Bukavu |
| `livreur@bwaka.cd` | Livreur | Goma |
| `admin@bwaka.cd` | Administrateur | Goma |

> En mode démonstration, une commande créée disparaît au redémarrage du serveur (stockage mémoire).
> Les mots de passe y sont **hachés avec scrypt**, jamais stockés en clair.

---

## 3. Brancher Supabase (production)

1. **Créer le projet** sur [supabase.com](https://supabase.com) (région la plus proche : `eu-central-1`).
2. **Exécuter le schéma** : *SQL Editor* → coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) → *Run*.
   Le script est idempotent et installe :
   - tables (`profiles`, `stores`, `products`, `orders`, `order_items`, `deliveries`, `transactions`, `reviews`, `disputes`, `categories`) ;
   - triggers (création du profil à l’inscription, recalcul de la note boutique) ;
   - fonctions métier (`bwaka_creer_commande`, `bwaka_changer_statut`, `bwaka_assigner_livraison`, `bwaka_avancer_livraison`) ;
   - **RLS** (Row Level Security) sur toutes les tables ;
   - bucket de stockage public `produits` pour les photos.
3. **Authentification** : *Authentication → Providers → Email* activé.
   En développement, désactivez « Confirm email » pour une connexion immédiate après inscription.
4. **Variables d’environnement** : copier `.env.example` en `.env.local` et renseigner
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
5. **Créer un administrateur** après inscription :
   ```sql
   update public.profiles set role = 'admin' where email = 'vous@exemple.cd';
   ```
6. Relancer `npm run dev`. L’application bascule automatiquement sur Supabase (le bandeau
   « mode démonstration » disparaît).

### Déploiement

- **Vercel** : importer le dépôt, ajouter les 3 variables d’environnement, déployer.
- **Supabase** : hébergé, sauvegardes et réplication gérées.
- Le middleware rafraîchit la session et protège `/compte`, `/vendeur`, `/livreur`, `/admin`.

---

## 4. Architecture du code

```
app/
  layout.tsx                  en-tête, pied de page, session, panier
  page.tsx                    accueil (marché, parcours, 3 espaces, boutiques)
  produits/                   catalogue + fiche produit (avis, séquestre, livraison)
  boutiques/                  annuaire et vitrine vendeur
  panier/                     panier + adresse + paiement
  commande/[id]/              suivi, confirmation de réception, litige, avis
  compte/                     espace acheteur
  vendeur/                    tableau de bord vendeur
  livreur/                    espace livreur
  admin/                      back-office
  connexion/ inscription/     authentification
  vendre/ livraison/          pages de conversion et zones/tarifs
  actions.ts                  Server Actions (auth, produits, commandes, avis, litiges)
  globals.css                 design system (tokens, composants, animations)
components/                   UI, panier (contexte), formulaires, header/footer
lib/
  types.ts                    modèle de données typé (snake_case = colonnes SQL)
  store.ts                    couche d’accès aux données (Supabase ↔ démo)
  session.ts                  session, hachage scrypt, jetons HMAC
  supabase/                   clients navigateur / serveur / service_role
  demo-data.ts                référentiels et jeu de données de démonstration
  utils.ts                    formatage CDF, zones de livraison, statuts, commission
supabase/schema.sql           base PostgreSQL complète (RLS, triggers, RPC)
middleware.ts                 rafraîchissement de session + routes protégées
```

### Comment le back-end est utilisé

- **Next.js Server Actions** : toutes les mutations passent par le serveur (`app/actions.ts`),
  jamais directement depuis le navigateur — la clé `service_role` n’est jamais exposée.
- **Deux modes transparents** : `lib/store.ts` expose une API unique (`listProduits`, `creerCommande`,
  `changerStatutCommande`…) et bascule entre Supabase et la base de démonstration.
- **Logique métier en base** : le calcul des totaux, la décrémentation du stock, les transitions de
  statut et la libération du séquestre sont atomiques dans des fonctions PostgreSQL (`security definer`),
  donc infalsifiables depuis le client.
- **RLS** : un acheteur ne voit que ses commandes, un vendeur que les lignes de sa boutique, un
  livreur que les missions libres et les siennes ; seul l’admin voit tout.

---

## 5. Modèle économique intégré

| Source | Paramètre dans le code |
| --- | --- |
| Commission sur transaction | `COMMISSION_TAUX = 0.04` (`lib/utils.ts`, `schema.sql`) |
| Frais de livraison par zone | `ZONES_LIVRAISON` : 2 500 / 4 500 / 9 000 FC |
| Abonnement vendeur premium | affiché dans le back-office (offre à activer) |
| Mise en avant sponsorisée | champ `products.en_avant` |

Le back-office reprend la projection de revenus de la proposition LK-TECH (mois 3 / 6 / 12) et les
hypothèses prudentes de la brochure.

---

## 6. Détails d’ingénierie

- **Mobile-first** : interface testée à 360 px, cibles tactiles ≥ 40 px, images `lazy`, JS initial ~100 kB.
- **Réseau faible** : pas de dépendance à des polices distantes, rendu serveur, animations désactivées
  sous `prefers-reduced-motion`.
- **Accessibilité** : navigation clavier, `aria-label`, `aria-live` sur les mises à jour, contrastes AA.
- **Sécurité** : mots de passe hachés (scrypt / Supabase Auth), jetons de session HMAC `httpOnly`,
  Server Actions validées côté serveur, RLS en base, aucune clé secrète côté client.
- **Qualité** : TypeScript strict, `npm run typecheck` et `npm run build` passent, aucun `any` implicite.

---

## 7. Scripts

```bash
npm run dev        # serveur de développement (0.0.0.0:3000)
npm run build      # build de production
npm start          # serveur de production
npm run typecheck  # vérification TypeScript
```

---

## 8. Suite du périmètre (brochure LK-TECH)

Le socle livré couvre les modules 01 à 06 de la proposition. Restent, selon la formule retenue :
intégration réelle de l’agrégateur mobile money (FlexPay / MaxiCash) et webhooks, notifications
push et SMS, suivi GPS temps réel, canal USSD/SMS, mode hors ligne complet, multilingue
(français / swahili / lingala), KYC avancé et API partenaires.

---

Développé par **[LK-TECH / LinkSmartec Sarl](https://www.linksmartec.com)** — Avenue du Lac, Goma,
Nord-Kivu, RDC · RCCM CD-GOM-01-2024-A-002698 · contact@linksmartec.com · +243 976 459 970.
