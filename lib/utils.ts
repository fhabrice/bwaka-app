import type {
  MethodePaiement,
  StatutCommande,
  StatutLivraison,
  StatutSequestre,
} from "./types";

// ---------------------------------------------------------------------------
// Montants
// ---------------------------------------------------------------------------
export const TAUX_USD = 2800; // indicatif, 1 USD ≈ 2 800 CDF
export const COMMISSION_TAUX = 0.04; // commission BWAKA : 4 %
export const DEVISE = "FC";

const nf = new Intl.NumberFormat("fr-FR");

export function fc(montant: number): string {
  return `${nf.format(Math.round(montant))} ${DEVISE}`;
}

export function usd(montant: number): string {
  return `${nf.format(Math.round(montant / TAUX_USD))} $`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateHeure(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function depuis(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours < 30) return `il y a ${jours} j`;
  return dateCourte(iso);
}

export function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ---------------------------------------------------------------------------
// Référentiels
// ---------------------------------------------------------------------------
export const OPERATEURS: Record<
  MethodePaiement,
  { nom: string; court: string; couleur: string }
> = {
  m_pesa: { nom: "M-Pesa (Vodacom)", court: "M-Pesa", couleur: "#E60000" },
  orange_money: { nom: "Orange Money", court: "Orange Money", couleur: "#FF7900" },
  airtel_money: { nom: "Airtel Money", court: "Airtel Money", couleur: "#E40000" },
  afrimoney: { nom: "Afrimoney", court: "Afrimoney", couleur: "#0A8F3C" },
  livraison: { nom: "Paiement à la livraison", court: "À la livraison", couleur: "#0F2D52" },
};

export const VILLES = ["Goma", "Bukavu", "Kinshasa", "Lubumbashi", "Kisangani", "Mbuji-Mayi"];

export const QUARTIERS: Record<string, string[]> = {
  Goma: ["Katindo", "Himbi", "Mabanga Nord", "Mabanga Sud", "Ndosho", "Kyeshero", "Murara"],
  Bukavu: ["Ibanda", "Kadutu", "Bagira", "Nguba"],
  Kinshasa: ["Gombe", "Limete", "Lemba", "Ngaliema", "Masina", "Bandalungwa"],
  Lubumbashi: ["Lubumbashi Centre", "Kampemba", "Katuba", "Kenya"],
  Kisangani: ["Makiso", "Tshopo", "Mangobo"],
  "Mbuji-Mayi": ["Diulu", "Kanshi", "Bipemba"],
};

/** Frais de livraison par zone (en francs congolais). */
export const ZONES_LIVRAISON: { zone: string; villes: string[]; frais: number; delai: string }[] = [
  { zone: "Centre-ville", villes: ["Goma", "Bukavu", "Kinshasa", "Lubumbashi"], frais: 2500, delai: "2 – 4 h" },
  { zone: "Périphérie", villes: ["Goma", "Bukavu", "Kinshasa", "Lubumbashi"], frais: 4500, delai: "4 – 8 h" },
  { zone: "Interurbain", villes: ["Goma", "Bukavu", "Kinshasa", "Lubumbashi", "Kisangani", "Mbuji-Mayi"], frais: 9000, delai: "24 – 48 h" },
];

export function fraisLivraison(ville: string, quartier: string): number {
  const centre = ["Gombe", "Ibanda", "Katindo", "Lubumbashi Centre", "Makiso", "Diulu"];
  if (centre.includes(quartier)) return ZONES_LIVRAISON[0].frais;
  if (VILLES.includes(ville)) return ZONES_LIVRAISON[1].frais;
  return ZONES_LIVRAISON[2].frais;
}

export const STATUTS_COMMANDE: Record<
  StatutCommande,
  { label: string; description: string; classe: string; icone: string }
> = {
  en_attente: {
    label: "En attente de paiement",
    description: "Le vendeur doit confirmer la disponibilité.",
    classe: "bg-amber-50 text-amber-700 ring-amber-200",
    icone: "⏳",
  },
  confirmee: {
    label: "Confirmée",
    description: "Paiement encaissé et bloqué en séquestre.",
    classe: "bg-sky-50 text-sky-700 ring-sky-200",
    icone: "✅",
  },
  expediee: {
    label: "En livraison",
    description: "Un livreur achemine votre colis.",
    classe: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    icone: "🛵",
  },
  livree: {
    label: "Livrée",
    description: "Réception confirmée, vendeur payé.",
    classe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icone: "📦",
  },
  annulee: {
    label: "Annulée",
    description: "Commande annulée, montant remboursé.",
    classe: "bg-rose-50 text-rose-700 ring-rose-200",
    icone: "✕",
  },
};

export const STATUTS_SEQUESTRE: Record<StatutSequestre, { label: string; classe: string }> = {
  en_attente: { label: "En attente de paiement", classe: "bg-slate-100 text-slate-600" },
  en_sequestre: { label: "Argent bloqué en séquestre", classe: "bg-amber-100 text-amber-800" },
  libere: { label: "Fonds versés au vendeur", classe: "bg-emerald-100 text-emerald-800" },
  rembourse: { label: "Remboursé à l’acheteur", classe: "bg-rose-100 text-rose-800" },
};

export const STATUTS_LIVRAISON: Record<StatutLivraison, { label: string; classe: string }> = {
  a_attribuer: { label: "À attribuer", classe: "bg-slate-100 text-slate-600" },
  assignee: { label: "Assignée", classe: "bg-sky-100 text-sky-800" },
  en_route: { label: "En route", classe: "bg-indigo-100 text-indigo-800" },
  livree: { label: "Livrée", classe: "bg-emerald-100 text-emerald-800" },
  echouee: { label: "Échouée", classe: "bg-rose-100 text-rose-800" },
};

export const ETAPES_COMMANDE: { statut: StatutCommande; label: string; icone: string }[] = [
  { statut: "en_attente", label: "Commande", icone: "🧾" },
  { statut: "confirmee", label: "Paiement bloqué", icone: "🔒" },
  { statut: "expediee", label: "En livraison", icone: "🛵" },
  { statut: "livree", label: "Réception", icone: "✅" },
];

export function etapeIndex(statut: StatutCommande): number {
  const ordre: StatutCommande[] = ["en_attente", "confirmee", "expediee", "livree"];
  return ordre.indexOf(statut);
}

export function genererCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
