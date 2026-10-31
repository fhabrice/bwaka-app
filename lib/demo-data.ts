import type {
  Avis,
  Boutique,
  Categorie,
  Commande,
  Litige,
  Livraison,
  Produit,
  Profil,
  Role,
  Transaction,
} from "./types";

// ---------------------------------------------------------------------------
// Référentiels statiques (identiques en mode Supabase et démo)
// ---------------------------------------------------------------------------
export const CATEGORIES: Categorie[] = [
  { slug: "mode", nom: "Mode & habillement", icone: "👗" },
  { slug: "electronique", nom: "Électronique", icone: "📱" },
  { slug: "alimentation", nom: "Alimentation", icone: "🥘" },
  { slug: "maison", nom: "Maison & cuisine", icone: "🏠" },
  { slug: "beaute", nom: "Beauté & soins", icone: "💅" },
  { slug: "agriculture", nom: "Agriculture", icone: "🌾" },
  { slug: "sport", nom: "Sport & loisirs", icone: "⚽" },
  { slug: "bebe", nom: "Bébé & enfants", icone: "🧸" },
];

export const CATEGORIE_NOM = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.nom]));

const now = Date.now();
const jours = (n: number) => new Date(now - n * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Données de démonstration
// ---------------------------------------------------------------------------
function seedProfils(): Profil[] {
  return [
    { id: "u_jean", nom: "Jean Kambale", email: "vendeur@bwaka.cd", telephone: "+243 970 000 001", ville: "Goma", role: "vendeur", verifie: true, created_at: jours(210), mot_de_passe: "demo123" },
    { id: "u_grace", nom: "Grâce Mwamba", email: "grace@bwaka.cd", telephone: "+243 970 000 002", ville: "Kinshasa", role: "vendeur", verifie: true, created_at: jours(180), mot_de_passe: "demo123" },
    { id: "u_esperance", nom: "Espérance Nabintu", email: "esperance@bwaka.cd", telephone: "+243 970 000 003", ville: "Bukavu", role: "vendeur", verifie: false, created_at: jours(90), mot_de_passe: "demo123" },
    { id: "u_acheteur", nom: "Aline Bisimwa", email: "acheteur@bwaka.cd", telephone: "+243 970 000 010", ville: "Goma", role: "acheteur", verifie: true, created_at: jours(60), mot_de_passe: "demo123" },
    { id: "u_livreur", nom: "Patrick Muhindo", email: "livreur@bwaka.cd", telephone: "+243 970 000 020", ville: "Goma", role: "livreur", verifie: true, created_at: jours(120), mot_de_passe: "demo123" },
    { id: "u_admin", nom: "Administration BWAKA", email: "admin@bwaka.cd", telephone: "+243 970 000 000", ville: "Goma", role: "admin", verifie: true, created_at: jours(300), mot_de_passe: "demo123" },
  ];
}

function seedBoutiques(): Boutique[] {
  return [
    { id: "s_kitoko", owner_id: "u_grace", nom: "Kitoko Mode", slug: "kitoko-mode", description: "Prêt-à-porter congolais, tissus wax et accessoires cousus à Kinshasa.", ville: "Kinshasa", quartier: "Gombe", logo: null, verifie: true, note: 4.8, ventes: 214, created_at: jours(170) },
    { id: "s_volcan", owner_id: "u_jean", nom: "Volcan Tech", slug: "volcan-tech", description: "Téléphones, accessoires et énergie solaire à Goma. Garantie 6 mois.", ville: "Goma", quartier: "Katindo", logo: null, verifie: true, note: 4.6, ventes: 389, created_at: jours(200) },
    { id: "s_kivu", owner_id: "u_esperance", nom: "Kivu Terroir", slug: "kivu-terroir", description: "Café, miel et produits du terroir du Sud-Kivu, livrés frais.", ville: "Bukavu", quartier: "Ibanda", logo: null, verifie: false, note: 4.9, ventes: 96, created_at: jours(85) },
  ];
}

type SeedProduit = [
  id: string,
  store: string,
  nom: string,
  description: string,
  prix: number,
  stock: number,
  cat: string,
  ville: string,
  image: string,
  avant?: boolean,
];

function seedProduits(): Produit[] {
  const rows: SeedProduit[] = [
    ["p_1", "s_volcan", "Smartphone Tecno Spark 20", "Écran 6,6\", 8 Go de RAM, 256 Go de stockage, batterie 5000 mAh. Double SIM, garanti 6 mois par Volcan Tech.", 385000, 12, "electronique", "Goma", "/images/telephone.jpg", true],
    ["p_2", "s_volcan", "Kit solaire domestique 100 W", "Panneau, batterie, régulateur et 4 lampes LED. Autonomie 8 h pour l’éclairage et la recharge des téléphones.", 275000, 8, "electronique", "Goma", "/images/solaire.jpg", true],
    ["p_3", "s_volcan", "Ordinateur portable HP i5", "HP EliteBook, i5 8e génération, 8 Go, SSD 256 Go, écran 14\". Révisé et testé par nos techniciens.", 690000, 4, "electronique", "Goma", "/images/ordinateur.jpg"],
    ["p_4", "s_kitoko", "Robe en wax cousue main", "Robe longue en tissu wax, coupe ajustée, tailles S à XL. Confection artisanale à Kinshasa sous 3 jours.", 78000, 15, "mode", "Kinshasa", "/images/robe.jpg", true],
    ["p_5", "s_kitoko", "Sac à main cuir et wax", "Sac structuré, cuir véritable et panneaux wax. Doublure coton, bandoulière amovible.", 92000, 9, "mode", "Kinshasa", "/images/baskets.jpg"],
    ["p_6", "s_kitoko", "Baskets urbaines taille 40-45", "Baskets légères, semelle antidérapante, respirantes. Idéales pour la saison des pluies.", 65000, 22, "mode", "Kinshasa", "/images/baskets.jpg"],
    ["p_7", "s_kivu", "Café Arabica du Kivu — 1 kg", "Grain torréfié artisanalement à Bukavu. Notes de cacao et agrumes, récolte 2026.", 28000, 40, "alimentation", "Bukavu", "/images/cafe.jpg", true],
    ["p_8", "s_kivu", "Miel de montagne — 500 g", "Miel brut non chauffé des hauts plateaux de Kalehe. Pot en verre recyclable.", 18000, 30, "alimentation", "Bukavu", "/images/cafe.jpg"],
    ["p_9", "s_volcan", "Panneau solaire 200 W", "Panneau monocristallin haut rendement, garantie 10 ans. Pour usage domestique ou boutique.", 215000, 6, "maison", "Goma", "/images/solaire.jpg"],
    ["p_10", "s_kitoko", "Ensemble pagne 3 pièces", "Tissu pagne de qualité supérieure, 6 yards, couleurs assorties. Vendu au mètre ou en lot.", 42000, 18, "mode", "Kinshasa", "/images/robe.jpg"],
    ["p_11", "s_kivu", "Farine de manioc — 5 kg", "Farine fine de manioc fermenté, séchée au soleil. Production coopérative de Kabare.", 12000, 50, "alimentation", "Bukavu", "/images/cafe.jpg"],
    ["p_12", "s_volcan", "Chargeur solaire de poche", "Batterie 10 000 mAh avec panneau intégré, double USB. Coupe les coupures de courant.", 35000, 25, "electronique", "Goma", "/images/solaire.jpg"],
  ];
  return rows.map(([id, store, nom, description, prix, stock, categorie_slug, ville, image, avant], i) => ({
    id,
    store_id: store,
    nom,
    slug: `${id}-${nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
    description,
    prix,
    devise: "CDF" as const,
    stock,
    categorie_slug,
    ville,
    image,
    statut: "actif" as const,
    en_avant: Boolean(avant),
    created_at: jours(i * 2 + 1),
  }));
}

function seedAvis(): Avis[] {
  return [
    { id: "a_1", product_id: "p_1", store_id: "s_volcan", order_id: null, auteur_id: "u_acheteur", auteur_nom: "Aline B.", note: 5, commentaire: "Téléphone conforme, livré à Katindo en 3 heures. Le paiement bloqué m’a rassurée.", created_at: jours(9) },
    { id: "a_2", product_id: "p_7", store_id: "s_kivu", order_id: null, auteur_id: "u_acheteur", auteur_nom: "Jonas K.", note: 5, commentaire: "Le meilleur café que j’ai bu cette année. Emballage très soigné.", created_at: jours(14) },
    { id: "a_3", product_id: "p_4", store_id: "s_kitoko", order_id: null, auteur_id: "u_acheteur", auteur_nom: "Sarah M.", note: 4, commentaire: "Très belle robe, juste une taille en dessous de prévu. La couturière a repris gratuitement.", created_at: jours(20) },
    { id: "a_4", product_id: "p_2", store_id: "s_volcan", order_id: null, auteur_id: "u_acheteur", auteur_nom: "Didier N.", note: 5, commentaire: "Installation faite le jour même. Plus de coupures à la maison.", created_at: jours(25) },
    { id: "a_5", product_id: "p_8", store_id: "s_kivu", order_id: null, auteur_id: "u_acheteur", auteur_nom: "Nadine T.", note: 4, commentaire: "Bon miel, goût franc. Livraison un peu lente vers Ndosho.", created_at: jours(31) },
  ];
}

function seedCommandes(): Commande[] {
  const commandes: Commande[] = [
    {
      id: "c_1",
      numero: "BWK-2026-0142",
      buyer_id: "u_acheteur",
      statut: "livree",
      sequestre: "libere",
      mode_paiement: "m_pesa",
      adresse: { nom: "Aline Bisimwa", telephone: "+243 970 000 010", ville: "Goma", quartier: "Katindo", indication: "Près de la paroisse, portail vert" },
      sous_total: 385000,
      frais_livraison: 2500,
      commission: 15400,
      total: 387500,
      code_livraison: "418203",
      created_at: jours(11),
      items: [{ id: "l_1", order_id: "c_1", product_id: "p_1", store_id: "s_volcan", nom: "Smartphone Tecno Spark 20", prix: 385000, quantite: 1, image: "/images/telephone.jpg" }],
    },
    {
      id: "c_2",
      numero: "BWK-2026-0158",
      buyer_id: "u_acheteur",
      statut: "expediee",
      sequestre: "en_sequestre",
      mode_paiement: "orange_money",
      adresse: { nom: "Aline Bisimwa", telephone: "+243 970 000 010", ville: "Goma", quartier: "Katindo", indication: "Sonner à l’interphone Bleu" },
      sous_total: 535000,
      frais_livraison: 2500,
      commission: 21400,
      total: 537500,
      code_livraison: "730915",
      created_at: jours(1),
      items: [
        { id: "l_2", order_id: "c_2", product_id: "p_2", store_id: "s_volcan", nom: "Kit solaire domestique 100 W", prix: 275000, quantite: 1, image: "/images/solaire.jpg" },
        { id: "l_3", order_id: "c_2", product_id: "p_9", store_id: "s_volcan", nom: "Panneau solaire 200 W", prix: 215000, quantite: 1, image: "/images/solaire.jpg" },
      ],
    },
    {
      id: "c_3",
      numero: "BWK-2026-0163",
      buyer_id: "u_acheteur",
      statut: "confirmee",
      sequestre: "en_sequestre",
      mode_paiement: "airtel_money",
      adresse: { nom: "Aline Bisimwa", telephone: "+243 970 000 010", ville: "Goma", quartier: "Katindo", indication: "" },
      sous_total: 28000,
      frais_livraison: 2500,
      commission: 1120,
      total: 30500,
      code_livraison: "556871",
      created_at: jours(0),
      items: [{ id: "l_4", order_id: "c_3", product_id: "p_7", store_id: "s_kivu", nom: "Café Arabica du Kivu — 1 kg", prix: 28000, quantite: 1, image: "/images/cafe.jpg" }],
    },
  ];
  return commandes;
}

function seedLivraisons(): Livraison[] {
  return [
    { id: "d_1", order_id: "c_2", livreur_id: "u_livreur", statut: "en_route", zone: "Centre-ville", tarif: 2500, code: "730915", created_at: jours(1), maj_at: jours(0) },
    { id: "d_2", order_id: "c_3", livreur_id: null, statut: "a_attribuer", zone: "Centre-ville", tarif: 2500, code: "556871", created_at: jours(0), maj_at: jours(0) },
  ];
}

function seedTransactions(): Transaction[] {
  return [
    { id: "t_1", order_id: "c_1", montant: 387500, operateur: "m_pesa", reference: "MP-8891A2", statut: "reussi", created_at: jours(11) },
    { id: "t_2", order_id: "c_2", montant: 537500, operateur: "orange_money", reference: "OM-4471C9", statut: "reussi", created_at: jours(1) },
    { id: "t_3", order_id: "c_3", montant: 30500, operateur: "airtel_money", reference: "AM-1184K7", statut: "reussi", created_at: jours(0) },
  ];
}

export interface DemoDB {
  profils: Profil[];
  boutiques: Boutique[];
  produits: Produit[];
  avis: Avis[];
  commandes: Commande[];
  livraisons: Livraison[];
  transactions: Transaction[];
  litiges: Litige[];
  compteur: number;
}

function seed(): DemoDB {
  return {
    profils: seedProfils(),
    boutiques: seedBoutiques(),
    produits: seedProduits(),
    avis: seedAvis(),
    commandes: seedCommandes(),
    livraisons: seedLivraisons(),
    transactions: seedTransactions(),
    litiges: [],
    compteur: 163,
  };
}

// Le store vit sur globalThis pour survivre au rechargement des modules en dev.
const globalRef = globalThis as unknown as { __bwakaDb?: DemoDB };

export function demoDb(): DemoDB {
  if (!globalRef.__bwakaDb) globalRef.__bwakaDb = seed();
  return globalRef.__bwakaDb;
}

export function resetDemoDb(): DemoDB {
  globalRef.__bwakaDb = seed();
  return globalRef.__bwakaDb;
}

export function nextId(prefix: string): string {
  const db = demoDb();
  db.compteur += 1;
  return `${prefix}_${db.compteur}`;
}

export const PROFIL_VIDE: Profil = {
  id: "",
  nom: "",
  email: "",
  telephone: "",
  ville: "",
  role: "acheteur" as Role,
  verifie: false,
  created_at: new Date().toISOString(),
};
