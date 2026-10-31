"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { demoDb } from "@/lib/demo-data";
import { modeDemo } from "@/lib/store";
import {
  ErreurMetier,
  assignerLivraison,
  boutiqueDuVendeur,
  changerStatutCommande,
  creerCommande,
  getCommande,
  type PanierLigne,
} from "@/lib/store";
import { supabaseConfigured, serverClient } from "@/lib/supabase/server";
import {
  hashMotDePasse,
  ouvrirSession,
  utilisateurCourant,
  verifierMotDePasse,
} from "@/lib/session";
import { slugify } from "@/lib/utils";
import type { MethodePaiement, Role } from "@/lib/types";

export interface EtatAction {
  ok?: boolean;
  erreur?: string;
  message?: string;
}

const MDP_MIN = 6;

function texte(fd: FormData, cle: string): string {
  return String(fd.get(cle) ?? "").trim();
}

function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------
export async function inscription(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const nom = texte(fd, "nom");
  const email = texte(fd, "email").toLowerCase();
  const telephone = texte(fd, "telephone");
  const ville = texte(fd, "ville");
  const motDePasse = String(fd.get("motDePasse") ?? "");
  const role = (texte(fd, "role") || "acheteur") as Role;
  const suite = texte(fd, "suite") || "/compte";

  if (!nom || !email || !telephone || !ville || !motDePasse) {
    return { erreur: "Tous les champs sont obligatoires." };
  }
  if (!emailValide(email)) return { erreur: "Adresse e-mail invalide." };
  if (motDePasse.length < MDP_MIN) {
    return { erreur: `Le mot de passe doit contenir au moins ${MDP_MIN} caractères.` };
  }
  if (!["acheteur", "vendeur", "livreur"].includes(role)) {
    return { erreur: "Rôle invalide." };
  }

  if (supabaseConfigured()) {
    const sb = await serverClient();
    const { error } = await sb!.auth.signUp({
      email,
      password: motDePasse,
      options: { data: { nom, telephone, ville, role } },
    });
    if (error) return { erreur: error.message };
    revalidatePath("/", "layout");
    redirect(role === "vendeur" ? "/vendeur" : role === "livreur" ? "/livreur" : suite);
  }

  const db = demoDb();
  if (db.profils.some((p) => p.email.toLowerCase() === email)) {
    return { erreur: "Un compte existe déjà avec cet e-mail." };
  }
  db.compteur += 1;
  db.profils.push({
    id: `u_${db.compteur}`,
    nom,
    email,
    telephone,
    ville,
    role,
    verifie: false,
    created_at: new Date().toISOString(),
    mot_de_passe: hashMotDePasse(motDePasse),
  });
  await ouvrirSession(`u_${db.compteur}`);
  revalidatePath("/", "layout");
  redirect(role === "vendeur" ? "/vendeur" : role === "livreur" ? "/livreur" : suite);
}

export async function connexion(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const email = texte(fd, "email").toLowerCase();
  const motDePasse = String(fd.get("motDePasse") ?? "");
  const suite = texte(fd, "suite") || "";

  if (!email || !motDePasse) return { erreur: "E-mail et mot de passe requis." };

  if (supabaseConfigured()) {
    const sb = await serverClient();
    const { error } = await sb!.auth.signInWithPassword({ email, password: motDePasse });
    if (error) return { erreur: "E-mail ou mot de passe incorrect." };
    revalidatePath("/", "layout");
    redirect(suite || "/compte");
  }

  const profil = demoDb().profils.find((p) => p.email.toLowerCase() === email);
  if (!profil || !verifierMotDePasse(motDePasse, profil.mot_de_passe)) {
    return { erreur: "E-mail ou mot de passe incorrect." };
  }
  await ouvrirSession(profil.id);
  revalidatePath("/", "layout");
  const destination =
    suite ||
    (profil.role === "admin"
      ? "/admin"
      : profil.role === "livreur"
        ? "/livreur"
        : profil.role === "vendeur"
          ? "/vendeur"
          : "/compte");
  redirect(destination);
}

// ---------------------------------------------------------------------------
// Boutique
// ---------------------------------------------------------------------------
export async function creerBoutique(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connexion requise." };

  const nom = texte(fd, "nom");
  const description = texte(fd, "description");
  const ville = texte(fd, "ville") || user.ville;
  const quartier = texte(fd, "quartier");

  if (!nom || !description) return { erreur: "Nom et description sont obligatoires." };
  if (await boutiqueDuVendeur(user.id)) return { erreur: "Vous avez déjà une boutique." };

  if (modeDemo) {
    const db = demoDb();
    db.compteur += 1;
    db.boutiques.push({
      id: `s_${db.compteur}`,
      owner_id: user.id,
      nom,
      slug: `${slugify(nom)}-${db.compteur}`,
      description,
      ville,
      quartier,
      logo: null,
      verifie: false,
      note: 0,
      ventes: 0,
      created_at: new Date().toISOString(),
    });
    const profil = db.profils.find((p) => p.id === user.id);
    if (profil && profil.role === "acheteur") profil.role = "vendeur";
  } else {
    const sb = await serverClient();
    const { error } = await sb!.from("stores").insert({
      owner_id: user.id,
      nom,
      slug: slugify(nom),
      description,
      ville,
      quartier,
    });
    if (error) return { erreur: error.message };
    await sb!.from("profiles").update({ role: "vendeur" }).eq("id", user.id);
  }

  revalidatePath("/vendeur");
  revalidatePath("/", "layout");
  return { ok: true, message: "Boutique créée. Publiez votre premier produit." };
}

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------
export async function enregistrerProduit(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connexion requise." };
  const boutique = await boutiqueDuVendeur(user.id);
  if (!boutique) return { erreur: "Créez d’abord votre boutique." };

  const id = texte(fd, "id");
  const nom = texte(fd, "nom");
  const description = texte(fd, "description");
  const categorie = texte(fd, "categorie");
  const ville = texte(fd, "ville") || boutique.ville;
  const prix = Number(fd.get("prix"));
  const stock = Number(fd.get("stock"));
  const image = texte(fd, "image") || null;
  const enAvant = fd.get("enAvant") === "on";

  if (!nom || !description || !categorie) {
    return { erreur: "Nom, description et catégorie sont obligatoires." };
  }
  if (!Number.isFinite(prix) || prix <= 0) return { erreur: "Le prix doit être un nombre positif." };
  if (!Number.isFinite(stock) || stock < 0) return { erreur: "Stock invalide." };

  if (modeDemo) {
    const db = demoDb();
    if (id) {
      const produit = db.produits.find((p) => p.id === id && p.store_id === boutique.id);
      if (!produit) return { erreur: "Produit introuvable." };
      Object.assign(produit, { nom, description, categorie_slug: categorie, ville, prix: Math.round(prix), stock, image, en_avant: enAvant });
    } else {
      db.compteur += 1;
      db.produits.unshift({
        id: `p_${db.compteur}`,
        store_id: boutique.id,
        nom,
        slug: `${slugify(nom)}-${db.compteur}`,
        description,
        prix: Math.round(prix),
        devise: "CDF",
        stock,
        categorie_slug: categorie,
        ville,
        image,
        statut: "actif",
        en_avant: enAvant,
        created_at: new Date().toISOString(),
      });
    }
  } else {
    const sb = await serverClient();
    const payload = {
      nom,
      description,
      categorie_slug: categorie,
      ville,
      prix: Math.round(prix),
      stock,
      image,
      en_avant: enAvant,
    };
    const { error } = id
      ? await sb!.from("products").update(payload).eq("id", id).eq("store_id", boutique.id)
      : await sb!
          .from("products")
          .insert({ ...payload, store_id: boutique.id, slug: `${slugify(nom)}-${Date.now().toString(36)}` });
    if (error) return { erreur: error.message };
  }

  revalidatePath("/vendeur");
  revalidatePath("/produits");
  revalidatePath("/");
  return { ok: true, message: id ? "Produit mis à jour." : "Produit publié." };
}

export async function basculerProduit(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) return;
  const id = texte(fd, "id");
  const statut = texte(fd, "statut") === "actif" ? "inactif" : "actif";

  if (modeDemo) {
    const db = demoDb();
    const produit = db.produits.find((p) => p.id === id);
    if (produit) produit.statut = statut;
  } else {
    const sb = await serverClient();
    await sb!.from("products").update({ statut }).eq("id", id);
  }
  revalidatePath("/vendeur");
  revalidatePath("/produits");
}

export async function supprimerProduit(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) return;
  const id = texte(fd, "id");

  if (modeDemo) {
    const db = demoDb();
    db.produits = db.produits.filter((p) => p.id !== id);
  } else {
    const sb = await serverClient();
    await sb!.from("products").delete().eq("id", id);
  }
  revalidatePath("/vendeur");
  revalidatePath("/produits");
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
export interface EtatCommande extends EtatAction {
  numero?: string;
  id?: string;
}

export async function passerCommande(_prev: EtatCommande, fd: FormData): Promise<EtatCommande> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connectez-vous pour finaliser votre commande." };

  let lignes: PanierLigne[] = [];
  try {
    lignes = JSON.parse(texte(fd, "lignes") || "[]") as PanierLigne[];
  } catch {
    return { erreur: "Panier illisible, veuillez le reconstituer." };
  }

  const adresse = {
    nom: texte(fd, "nom"),
    telephone: texte(fd, "telephone"),
    ville: texte(fd, "ville"),
    quartier: texte(fd, "quartier"),
    indication: texte(fd, "indication"),
  };
  const modePaiement = texte(fd, "mode_paiement") as MethodePaiement;

  if (!adresse.nom || !adresse.telephone || !adresse.ville || !adresse.quartier) {
    return { erreur: "Complétez l’adresse de livraison." };
  }
  if (!["m_pesa", "orange_money", "airtel_money", "afrimoney", "livraison"].includes(modePaiement)) {
    return { erreur: "Choisissez un moyen de paiement." };
  }

  try {
    const commande = await creerCommande({ userId: user.id, lignes, adresse, mode_paiement: modePaiement });
    revalidatePath("/compte");
    revalidatePath("/vendeur");
    return { ok: true, id: commande.id, numero: commande.numero };
  } catch (e) {
    if (e instanceof ErreurMetier) return { erreur: e.message };
    return { erreur: "La commande n’a pas pu être créée. Réessayez." };
  }
}

export async function mettreAJourStatut(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) return;
  const id = texte(fd, "id");
  const statut = texte(fd, "statut") as "confirmee" | "expediee" | "livree" | "annulee";
  try {
    await changerStatutCommande(id, statut);
  } catch {
    /* transition refusée */
  }
  revalidatePath("/vendeur");
  revalidatePath("/compte");
  revalidatePath("/admin");
  revalidatePath("/livreur");
  revalidatePath(`/commande/${id}`);
}

export async function confirmerReception(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connexion requise." };
  const id = texte(fd, "id");
  const code = texte(fd, "code");

  const commande = await getCommande(id);
  if (!commande) return { erreur: "Commande introuvable." };
  if (commande.buyer_id !== user.id && user.role !== "admin") {
    return { erreur: "Seul l’acheteur peut confirmer la réception." };
  }
  if (commande.statut === "livree") return { ok: true, message: "Réception déjà confirmée." };
  if (commande.statut !== "expediee" && commande.statut !== "confirmee") {
    return { erreur: "La commande n’est pas encore en livraison." };
  }
  if (code !== commande.code_livraison) {
    return { erreur: "Code incorrect. Vérifiez le SMS reçu de BWAKA." };
  }

  try {
    await changerStatutCommande(id, "livree");
  } catch (e) {
    return { erreur: e instanceof ErreurMetier ? e.message : "Impossible de confirmer." };
  }
  revalidatePath("/compte");
  revalidatePath(`/commande/${id}`);
  return { ok: true, message: "Réception confirmée, le vendeur a été payé." };
}

// ---------------------------------------------------------------------------
// Livraison
// ---------------------------------------------------------------------------
export async function prendreMission(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) return;
  try {
    await assignerLivraison(texte(fd, "id"), user.id);
  } catch {
    /* déjà prise par un autre livreur */
  }
  revalidatePath("/livreur");
}

export async function avancerLivraison(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user) return;
  const id = texte(fd, "id");
  const action = texte(fd, "action");

  if (modeDemo) {
    const db = demoDb();
    const livraison = db.livraisons.find((l) => l.id === id);
    if (!livraison) return;
    const commande = db.commandes.find((c) => c.id === livraison.order_id);
    if (action === "demarrer") {
      livraison.statut = "en_route";
      if (commande && commande.statut === "confirmee") {
        commande.statut = "expediee";
        livraison.maj_at = new Date().toISOString();
      }
    }
    if (action === "livrer") {
      livraison.statut = "livree";
      if (commande) {
        commande.statut = "livree";
        commande.sequestre = "libere";
      }
      livraison.maj_at = new Date().toISOString();
    }
  } else {
    const sb = await serverClient();
    await sb!.rpc("bwaka_avancer_livraison", { p_delivery: id, p_action: action });
  }
  revalidatePath("/livreur");
  revalidatePath("/compte");
}

// ---------------------------------------------------------------------------
// Avis & litiges
// ---------------------------------------------------------------------------
export async function laisserAvis(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connexion requise." };
  const productId = texte(fd, "product_id");
  const storeId = texte(fd, "store_id");
  const orderId = texte(fd, "order_id") || null;
  const note = Number(fd.get("note"));
  const commentaire = texte(fd, "commentaire");

  if (!productId || !storeId) return { erreur: "Produit inconnu." };
  if (!Number.isFinite(note) || note < 1 || note > 5) return { erreur: "Donnez une note de 1 à 5." };
  if (commentaire.length < 10) return { erreur: "Votre commentaire est trop court (10 caractères min.)." };

  if (modeDemo) {
    const db = demoDb();
    db.compteur += 1;
    db.avis.unshift({
      id: `a_${db.compteur}`,
      product_id: productId,
      store_id: storeId,
      order_id: orderId,
      auteur_id: user.id,
      auteur_nom: user.nom,
      note,
      commentaire,
      created_at: new Date().toISOString(),
    });
  } else {
    const sb = await serverClient();
    const { error } = await sb!.from("reviews").insert({
      product_id: productId,
      store_id: storeId,
      order_id: orderId,
      auteur_id: user.id,
      auteur_nom: user.nom,
      note,
      commentaire,
    });
    if (error) return { erreur: error.message };
  }
  revalidatePath("/produits");
  return { ok: true, message: "Merci, votre avis est publié." };
}

export async function ouvrirLitige(_prev: EtatAction, fd: FormData): Promise<EtatAction> {
  const user = await utilisateurCourant();
  if (!user) return { erreur: "Connexion requise." };
  const orderId = texte(fd, "order_id");
  const motif = texte(fd, "motif");
  if (motif.length < 15) return { erreur: "Décrivez le problème en 15 caractères minimum." };

  if (modeDemo) {
    const db = demoDb();
    db.compteur += 1;
    db.litiges.unshift({
      id: `f_${db.compteur}`,
      order_id: orderId,
      ouvert_par: user.id,
      motif,
      statut: "ouvert",
      resolution: null,
      created_at: new Date().toISOString(),
    });
  } else {
    const sb = await serverClient();
    const { error } = await sb!.from("disputes").insert({
      order_id: orderId,
      ouvert_par: user.id,
      motif,
    });
    if (error) return { erreur: error.message };
  }
  revalidatePath("/admin");
  revalidatePath(`/commande/${orderId}`);
  return { ok: true, message: "Litige ouvert. L’équipe BWAKA vous contacte sous 24 h." };
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------
export async function traiterLitige(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user || user.role !== "admin") return;
  const id = texte(fd, "id");
  const statut = texte(fd, "statut") as "en_cours" | "resolu" | "rejete";

  if (modeDemo) {
    const litige = demoDb().litiges.find((l) => l.id === id);
    if (litige) {
      litige.statut = statut;
      litige.resolution = statut === "resolu" ? "Remboursement validé" : null;
    }
  } else {
    const sb = await serverClient();
    await sb!.from("disputes").update({ statut }).eq("id", id);
  }
  revalidatePath("/admin");
}

export async function verifierVendeur(fd: FormData): Promise<void> {
  const user = await utilisateurCourant();
  if (!user || user.role !== "admin") return;
  const id = texte(fd, "id");
  const verifie = texte(fd, "verifie") === "true";

  if (modeDemo) {
    const boutique = demoDb().boutiques.find((b) => b.id === id);
    if (boutique) boutique.verifie = verifie;
  } else {
    const sb = await serverClient();
    await sb!.from("stores").update({ verifie }).eq("id", id);
  }
  revalidatePath("/admin");
  revalidatePath("/boutiques");
}
