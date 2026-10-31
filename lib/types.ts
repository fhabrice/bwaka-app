// ---------------------------------------------------------------------------
// BWAKA — modèle de données
// Les noms de champs correspondent exactement aux colonnes PostgreSQL
// définies dans supabase/schema.sql (snake_case partout).
// ---------------------------------------------------------------------------

export type Role = "acheteur" | "vendeur" | "livreur" | "admin";

export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "expediee"
  | "livree"
  | "annulee";

export type StatutSequestre =
  | "en_attente"
  | "en_sequestre"
  | "libere"
  | "rembourse";

export type MethodePaiement =
  | "m_pesa"
  | "orange_money"
  | "airtel_money"
  | "afrimoney"
  | "livraison";

export type StatutLivraison =
  | "a_attribuer"
  | "assignee"
  | "en_route"
  | "livree"
  | "echouee";

export interface Profil {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  role: Role;
  verifie: boolean;
  created_at: string;
  /** Uniquement en mode démonstration (jamais stocké côté Supabase). */
  mot_de_passe?: string;
}

export interface SessionUser {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  role: Role;
  verifie: boolean;
}

export interface Boutique {
  id: string;
  owner_id: string;
  nom: string;
  slug: string;
  description: string;
  ville: string;
  quartier: string;
  logo: string | null;
  verifie: boolean;
  note: number;
  ventes: number;
  created_at: string;
}

export interface Produit {
  id: string;
  store_id: string;
  nom: string;
  slug: string;
  description: string;
  prix: number;
  devise: "CDF";
  stock: number;
  categorie_slug: string;
  ville: string;
  image: string | null;
  statut: "actif" | "inactif";
  en_avant: boolean;
  created_at: string;
}

export interface ProduitAvecBoutique extends Produit {
  boutique: Pick<Boutique, "id" | "nom" | "slug" | "verifie" | "note" | "ville">;
  note_moyenne: number;
  nombre_avis: number;
}

export interface LigneCommande {
  id: string;
  order_id: string;
  product_id: string;
  store_id: string;
  nom: string;
  prix: number;
  quantite: number;
  image: string | null;
}

export interface Adresse {
  nom: string;
  telephone: string;
  ville: string;
  quartier: string;
  indication?: string;
}

export interface Commande {
  id: string;
  numero: string;
  buyer_id: string;
  statut: StatutCommande;
  sequestre: StatutSequestre;
  mode_paiement: MethodePaiement;
  adresse: Adresse;
  sous_total: number;
  frais_livraison: number;
  commission: number;
  total: number;
  code_livraison: string;
  created_at: string;
  items: LigneCommande[];
  acheteur?: Pick<Profil, "nom" | "telephone" | "email">;
}

export interface Livraison {
  id: string;
  order_id: string;
  livreur_id: string | null;
  statut: StatutLivraison;
  zone: string;
  tarif: number;
  code: string;
  livreur_nom?: string | null;
  created_at: string;
  maj_at: string;
  commande?: Commande;
}

export interface Avis {
  id: string;
  product_id: string;
  store_id: string;
  order_id: string | null;
  auteur_id: string;
  auteur_nom: string;
  note: number;
  commentaire: string;
  created_at: string;
}

export interface Litige {
  id: string;
  order_id: string;
  ouvert_par: string;
  motif: string;
  statut: "ouvert" | "en_cours" | "resolu" | "rejete";
  resolution: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  montant: number;
  operateur: MethodePaiement;
  reference: string;
  statut: "en_attente" | "reussi" | "echoue" | "rembourse";
  created_at: string;
}

export interface Categorie {
  slug: string;
  nom: string;
  icone: string;
}

export interface StatsVendeur {
  produitsActifs: number;
  totalProduits: number;
  commandes: number;
  chiffreAffaires: number;
  commissions: number;
  note: number;
}

export interface StatsAdmin {
  vendeurs: number;
  acheteurs: number;
  livreurs: number;
  produits: number;
  commandes: number;
  volume: number;
  commissions: number;
  sequestre: number;
  litiges: number;
}

export interface FiltresCatalogue {
  q?: string;
  categorie?: string;
  ville?: string;
  store?: string;
  tri?: "recent" | "prix_asc" | "prix_desc";
}
