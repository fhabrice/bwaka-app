import "server-only";

import { demoDb } from "./demo-data";
import { CATEGORIES } from "./demo-data";
import { COMMISSION_TAUX, fraisLivraison } from "./utils";
import type {
  Avis,
  Boutique,
  Categorie,
  Commande,
  FiltresCatalogue,
  Litige,
  Livraison,
  Produit,
  ProduitAvecBoutique,
  Profil,
  StatsAdmin,
  StatsVendeur,
} from "./types";
import { supabaseConfigured, serverClient } from "./supabase/server";

/**
 * Couche d'accès aux données de BWAKA.
 * - Supabase configuré → requêtes SQL protégées par RLS.
 * - Sinon → base de démonstration en mémoire (données réalistes, non persistées).
 */
export const modeDemo = !supabaseConfigured();
export { CATEGORIES };

async function sb() {
  return serverClient();
}

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------
function noteParProduit(source: { product_id: string; note: number }[]) {
  const acc = new Map<string, { somme: number; n: number }>();
  for (const a of source) {
    const v = acc.get(a.product_id) ?? { somme: 0, n: 0 };
    v.somme += a.note;
    v.n += 1;
    acc.set(a.product_id, v);
  }
  return acc;
}

export async function listProduits(filtres: FiltresCatalogue = {}): Promise<ProduitAvecBoutique[]> {
  let produits: Produit[] = [];
  let boutiques: Boutique[] = [];
  let avis: { product_id: string; note: number }[] = [];

  if (modeDemo) {
    const db = demoDb();
    produits = db.produits.filter((p) => p.statut === "actif");
    boutiques = db.boutiques;
    avis = db.avis;
  } else {
    const client = await sb();
    const { data } = await client!
      .from("products")
      .select("*, boutique:stores(id,nom,slug,verifie,note,ville)")
      .eq("statut", "actif");
    if (!data) return [];
    produits = data as Produit[];
    const { data: reviews } = await client!.from("reviews").select("product_id, note");
    avis = (reviews ?? []) as { product_id: string; note: number }[];
    return filtrer(produits as unknown as ProduitAvecBoutique[], filtres);
  }

  const notes = noteParProduit(avis);
  const enrichis: ProduitAvecBoutique[] = produits.map((p) => {
    const b = boutiques.find((x) => x.id === p.store_id);
    const n = notes.get(p.id);
    return {
      ...p,
      boutique: b
        ? { id: b.id, nom: b.nom, slug: b.slug, verifie: b.verifie, note: b.note, ville: b.ville }
        : { id: p.store_id, nom: "Boutique", slug: "", verifie: false, note: 0, ville: p.ville },
      note_moyenne: n ? Math.round((n.somme / n.n) * 10) / 10 : 0,
      nombre_avis: n?.n ?? 0,
    };
  });
  return filtrer(enrichis, filtres);
}

function filtrer(liste: ProduitAvecBoutique[], f: FiltresCatalogue): ProduitAvecBoutique[] {
  let out = liste;
  if (f.q) {
    const t = f.q.toLowerCase();
    out = out.filter(
      (p) =>
        p.nom.toLowerCase().includes(t) ||
        p.description.toLowerCase().includes(t) ||
        (p.boutique?.nom ?? "").toLowerCase().includes(t),
    );
  }
  if (f.categorie) out = out.filter((p) => p.categorie_slug === f.categorie);
  if (f.ville) out = out.filter((p) => p.ville === f.ville);
  if (f.store) out = out.filter((p) => p.store_id === f.store);
  const tri = f.tri ?? "recent";
  return [...out].sort((a, b) => {
    if (tri === "prix_asc") return a.prix - b.prix;
    if (tri === "prix_desc") return b.prix - a.prix;
    if (a.en_avant !== b.en_avant) return a.en_avant ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function produitsEnAvant(limite = 4): Promise<ProduitAvecBoutique[]> {
  const tous = await listProduits();
  return tous.slice(0, limite);
}

export async function getProduit(idOrSlug: string): Promise<ProduitAvecBoutique | null> {
  const tous = await listProduits();
  return tous.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
}

export async function produitsDeBoutique(storeId: string): Promise<ProduitAvecBoutique[]> {
  return listProduits({ store: storeId });
}

export async function avisDuProduit(productId: string): Promise<Avis[]> {
  if (modeDemo) {
    return demoDb().avis.filter((a) => a.product_id === productId);
  }
  const client = await sb();
  const { data } = await client!
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Avis[];
}

// ---------------------------------------------------------------------------
// Boutiques
// ---------------------------------------------------------------------------
export async function listBoutiques(): Promise<Boutique[]> {
  if (modeDemo) return demoDb().boutiques;
  const client = await sb();
  const { data } = await client!.from("stores").select("*").order("ventes", { ascending: false });
  return (data ?? []) as Boutique[];
}

export async function getBoutique(slugOrId: string): Promise<Boutique | null> {
  const liste = await listBoutiques();
  return liste.find((b) => b.slug === slugOrId || b.id === slugOrId) ?? null;
}

export async function boutiqueDuVendeur(ownerId: string): Promise<Boutique | null> {
  const liste = await listBoutiques();
  return liste.find((b) => b.owner_id === ownerId) ?? null;
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
function trierCommandes(liste: Commande[]): Commande[] {
  return [...liste].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function getCommande(id: string): Promise<Commande | null> {
  if (modeDemo) {
    const db = demoDb();
    const c = db.commandes.find((x) => x.id === id || x.numero === id);
    if (!c) return null;
    const acheteur = db.profils.find((p) => p.id === c.buyer_id);
    return {
      ...c,
      acheteur: acheteur
        ? { nom: acheteur.nom, telephone: acheteur.telephone, email: acheteur.email }
        : undefined,
    };
  }
  const client = await sb();
  const { data } = await client!
    .from("orders")
    .select("*, items:order_items(*), acheteur:profiles!orders_buyer_id_fkey(nom,telephone,email)")
    .or(`id.eq.${id},numero.eq.${id}`)
    .maybeSingle();
  return (data as Commande) ?? null;
}

export async function commandesAcheteur(userId: string): Promise<Commande[]> {
  if (modeDemo) {
    return trierCommandes(demoDb().commandes.filter((c) => c.buyer_id === userId));
  }
  const client = await sb();
  const { data } = await client!
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Commande[];
}

export async function ventesVendeur(storeId: string): Promise<Commande[]> {
  if (modeDemo) {
    return trierCommandes(
      demoDb()
        .commandes.filter((c) => c.items.some((i) => i.store_id === storeId))
        .map((c) => ({ ...c, items: c.items.filter((i) => i.store_id === storeId) })),
    );
  }
  const client = await sb();
  const { data } = await client!
    .from("order_items")
    .select("order_id, orders!inner(*, items:order_items(*))")
    .eq("store_id", storeId);
  const map = new Map<string, Commande>();
  for (const ligne of data ?? []) {
    const commande = (ligne as unknown as { orders: Commande }).orders;
    if (!commande || map.has(commande.id)) continue;
    map.set(commande.id, { ...commande, items: commande.items.filter((i) => i.store_id === storeId) });
  }
  return trierCommandes([...map.values()]);
}

export async function toutesLesCommandes(): Promise<Commande[]> {
  if (modeDemo) return trierCommandes(demoDb().commandes);
  const client = await sb();
  const { data } = await client!
    .from("orders")
    .select("*, items:order_items(*), acheteur:profiles!orders_buyer_id_fkey(nom,telephone,email)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as Commande[];
}

// ---------------------------------------------------------------------------
// Livraisons
// ---------------------------------------------------------------------------
export async function livraisonsLivreur(livreurId: string): Promise<Livraison[]> {
  if (modeDemo) return demoDb().livraisons.filter((l) => l.livreur_id === livreurId);
  const client = await sb();
  const { data } = await client!
    .from("deliveries")
    .select("*")
    .eq("livreur_id", livreurId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Livraison[];
}

export async function livraisonsDisponibles(): Promise<Livraison[]> {
  if (modeDemo) return demoDb().livraisons.filter((l) => l.statut === "a_attribuer");
  const client = await sb();
  const { data } = await client!
    .from("deliveries")
    .select("*")
    .eq("statut", "a_attribuer")
    .order("created_at", { ascending: false });
  return (data ?? []) as Livraison[];
}

export async function toutesLesLivraisons(): Promise<Livraison[]> {
  if (modeDemo) return demoDb().livraisons;
  const client = await sb();
  const { data } = await client!
    .from("deliveries")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Livraison[];
}

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------
const somme = (liste: number[]) => liste.reduce((s, v) => s + v, 0);

export async function statsVendeur(storeId: string): Promise<StatsVendeur> {
  const produits = await produitsDeBoutique(storeId);
  const ventes = await ventesVendeur(storeId);
  const valides = ventes.filter((c) => c.statut !== "annulee");
  const ca = somme(valides.map((c) => somme(c.items.map((i) => i.prix * i.quantite))));
  const boutique = await getBoutique(storeId);
  return {
    produitsActifs: produits.length,
    totalProduits: produits.length,
    commandes: ventes.length,
    chiffreAffaires: ca,
    commissions: Math.round(ca * COMMISSION_TAUX),
    note: boutique?.note ?? 0,
  };
}

export async function statsAdmin(): Promise<StatsAdmin> {
  const profils: Profil[] = modeDemo
    ? demoDb().profils
    : (((await (await sb())!.from("profiles").select("*")).data ?? []) as Profil[]);
  const commandes = await toutesLesCommandes();
  const boutiques = await listBoutiques();
  const litiges = await listLitiges();
  const produits = modeDemo
    ? demoDb().produits
    : (((await (await sb())!.from("products").select("id")).data ?? []) as { id: string }[]);
  const valides = commandes.filter((c) => c.statut !== "annulee");
  const volume = somme(valides.map((c) => c.total));
  return {
    vendeurs: profils.filter((p) => p.role === "vendeur").length || boutiques.length,
    acheteurs: profils.filter((p) => p.role === "acheteur").length,
    livreurs: profils.filter((p) => p.role === "livreur").length,
    produits: produits.length,
    commandes: commandes.length,
    volume,
    commissions: Math.round(volume * COMMISSION_TAUX),
    sequestre: somme(
      commandes.filter((c) => c.sequestre === "en_sequestre").map((c) => c.total),
    ),
    litiges: litiges.filter((l) => l.statut !== "resolu" && l.statut !== "rejete").length,
  };
}

export async function listLitiges(): Promise<Litige[]> {
  if (modeDemo) return demoDb().litiges;
  const client = await sb();
  const { data } = await client!
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Litige[];
}

// ---------------------------------------------------------------------------
// Catalogue & commande (mutations — utilisées par les Server Actions)
// ---------------------------------------------------------------------------
export interface PanierLigne {
  produitId: string;
  quantite: number;
}

export class ErreurMetier extends Error {}

export function validerPanier(produits: ProduitAvecBoutique[], lignes: PanierLigne[]) {
  if (!lignes.length) throw new ErreurMetier("Votre panier est vide.");
  const detail = lignes.map((l) => {
    const p = produits.find((x) => x.id === l.produitId);
    if (!p) throw new ErreurMetier("Un produit du panier n’existe plus.");
    const quantite = Math.max(1, Math.min(l.quantite, p.stock));
    if (p.stock < l.quantite) {
      throw new ErreurMetier(`Stock insuffisant pour « ${p.nom} » (${p.stock} restants).`);
    }
    return { produit: p, quantite };
  });
  const sousTotal = somme(detail.map((d) => d.produit.prix * d.quantite));
  return { detail, sousTotal };
}

export function calculerTotaux(sousTotal: number, ville: string, quartier: string) {
  const livraison = fraisLivraison(ville, quartier);
  const commission = Math.round(sousTotal * COMMISSION_TAUX);
  return { livraison, commission, total: sousTotal + livraison };
}

export async function creerCommande(payload: {
  userId: string;
  lignes: PanierLigne[];
  adresse: { nom: string; telephone: string; ville: string; quartier: string; indication?: string };
  mode_paiement: Commande["mode_paiement"];
}): Promise<Commande> {
  const produits = await listProduits();
  const { detail, sousTotal } = validerPanier(produits, payload.lignes);
  const { livraison, commission, total } = calculerTotaux(
    sousTotal,
    payload.adresse.ville,
    payload.adresse.quartier,
  );
  const code = String(Math.floor(100000 + Math.random() * 900000));

  if (modeDemo) {
    const db = demoDb();
    db.compteur += 1;
    const numero = `BWK-2026-${String(db.compteur).padStart(4, "0")}`;
    const id = `c_${db.compteur}`;
    const commande: Commande = {
      id,
      numero,
      buyer_id: payload.userId,
      statut: payload.mode_paiement === "livraison" ? "en_attente" : "confirmee",
      sequestre: payload.mode_paiement === "livraison" ? "en_attente" : "en_sequestre",
      mode_paiement: payload.mode_paiement,
      adresse: payload.adresse,
      sous_total: sousTotal,
      frais_livraison: livraison,
      commission,
      total,
      code_livraison: code,
      created_at: new Date().toISOString(),
      items: detail.map((d, i) => ({
        id: `l_${db.compteur}_${i}`,
        order_id: id,
        product_id: d.produit.id,
        store_id: d.produit.store_id,
        nom: d.produit.nom,
        prix: d.produit.prix,
        quantite: d.quantite,
        image: d.produit.image,
      })),
    };
    db.commandes.unshift(commande);
    for (const d of detail) {
      const p = db.produits.find((x) => x.id === d.produit.id);
      if (p) p.stock = Math.max(0, p.stock - d.quantite);
    }
    db.livraisons.unshift({
      id: `d_${db.compteur}`,
      order_id: id,
      livreur_id: null,
      statut: "a_attribuer",
      zone: "Centre-ville",
      tarif: livraison,
      code,
      created_at: new Date().toISOString(),
      maj_at: new Date().toISOString(),
    });
    if (payload.mode_paiement !== "livraison") {
      db.transactions.unshift({
        id: `t_${db.compteur}`,
        order_id: id,
        montant: total,
        operateur: payload.mode_paiement,
        reference: `${payload.mode_paiement.toUpperCase().slice(0, 2)}-${code}`,
        statut: "reussi",
        created_at: new Date().toISOString(),
      });
    }
    return commande;
  }

  const client = await sb();
  const { data, error } = await client!.rpc("bwaka_creer_commande", {
    p_items: payload.lignes,
    p_adresse: payload.adresse,
    p_mode_paiement: payload.mode_paiement,
  });
  if (error) throw new ErreurMetier(error.message);
  return data as Commande;
}

/** Transitions autorisées selon la brochure (parcours de bout en bout). */
export const TRANSITIONS: Record<string, string[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["expediee", "annulee"],
  expediee: ["livree"],
  livree: [],
  annulee: [],
};

export async function changerStatutCommande(
  orderId: string,
  statut: Commande["statut"],
): Promise<void> {
  if (modeDemo) {
    const db = demoDb();
    const c = db.commandes.find((x) => x.id === orderId || x.numero === orderId);
    if (!c) throw new ErreurMetier("Commande introuvable.");
    if (!(TRANSITIONS[c.statut] ?? []).includes(statut)) {
      throw new ErreurMetier(`Transition impossible : ${c.statut} → ${statut}.`);
    }
    c.statut = statut;
    if (statut === "confirmee") c.sequestre = "en_sequestre";
    if (statut === "livree") c.sequestre = "libere";
    if (statut === "annulee") {
      c.sequestre = "rembourse";
      for (const item of c.items) {
        const p = db.produits.find((x) => x.id === item.product_id);
        if (p) p.stock += item.quantite;
      }
    }
    const livraison = db.livraisons.find((l) => l.order_id === c.id);
    if (livraison) {
      if (statut === "expediee") livraison.statut = "en_route";
      if (statut === "livree") livraison.statut = "livree";
      if (statut === "annulee") livraison.statut = "echouee";
      livraison.maj_at = new Date().toISOString();
    }
    return;
  }
  const client = await sb();
  const { error } = await client!.rpc("bwaka_changer_statut", {
    p_order: orderId,
    p_statut: statut,
  });
  if (error) throw new ErreurMetier(error.message);
}

export async function assignerLivraison(deliveryId: string, livreurId: string): Promise<void> {
  if (modeDemo) {
    const l = demoDb().livraisons.find((x) => x.id === deliveryId);
    if (!l) throw new ErreurMetier("Livraison introuvable.");
    l.livreur_id = livreurId;
    l.statut = "assignee";
    l.maj_at = new Date().toISOString();
    return;
  }
  const client = await sb();
  const { error } = await client!.rpc("bwaka_assigner_livraison", {
    p_delivery: deliveryId,
    p_livreur: livreurId,
  });
  if (error) throw new ErreurMetier(error.message);
}
