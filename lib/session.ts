import "server-only";

import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { demoDb } from "./demo-data";
import type { Profil, SessionUser } from "./types";
import { supabaseConfigured, serverClient } from "./supabase/server";

const COOKIE = "bwaka_session";
const SECRET = process.env.BWAKA_DEMO_SECRET || "bwaka-demo-secret-a-changer";
const DUREE = 60 * 60 * 24 * 30; // 30 jours

// ---------------------------------------------------------------------------
// Mots de passe (mode démonstration uniquement — Supabase gère ses propres
// hashes bcrypt côté auth.users quand il est configuré)
// ---------------------------------------------------------------------------
export function hashMotDePasse(motDePasse: string): string {
  const sel = randomBytes(16).toString("hex");
  const hash = scryptSync(motDePasse, sel, 64).toString("hex");
  return `scrypt$${sel}$${hash}`;
}

export function verifierMotDePasse(motDePasse: string, stocke: string | undefined): boolean {
  if (!stocke) return false;
  if (!stocke.startsWith("scrypt$")) return stocke === motDePasse;
  const [, sel, hash] = stocke.split("$");
  if (!sel || !hash) return false;
  const attendu = Buffer.from(hash, "hex");
  const calcule = scryptSync(motDePasse, sel, attendu.length);
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

// ---------------------------------------------------------------------------
// Jeton de session (HMAC signé, comme lib/auth.js de la v1)
// ---------------------------------------------------------------------------
function signer(charge: string): string {
  return createHmac("sha256", SECRET).update(charge).digest("base64url");
}

export function creerJeton(uid: string): string {
  const charge = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + DUREE * 1000 }),
  ).toString("base64url");
  return `${charge}.${signer(charge)}`;
}

export function verifierJeton(jeton: string | undefined): string | null {
  if (!jeton) return null;
  const [charge, signature] = jeton.split(".");
  if (!charge || !signature) return null;
  const attendu = signer(charge);
  if (attendu.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(attendu), Buffer.from(signature))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(charge, "base64url").toString()) as {
      uid: string;
      exp: number;
    };
    if (!uid || !exp || exp < Date.now()) return null;
    return uid;
  } catch {
    return null;
  }
}

export async function ouvrirSession(uid: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, creerJeton(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE,
  });
}

export async function fermerSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
  if (supabaseConfigured()) {
    const sb = await serverClient();
    await sb?.auth.signOut();
  }
}

export function versSession(p: Profil): SessionUser {
  return {
    id: p.id,
    nom: p.nom,
    email: p.email,
    telephone: p.telephone,
    ville: p.ville,
    role: p.role,
    verifie: p.verifie,
  };
}

// ---------------------------------------------------------------------------
// Utilisateur courant — Supabase si configuré, sinon session de démonstration
// ---------------------------------------------------------------------------
export async function utilisateurCourant(): Promise<SessionUser | null> {
  if (supabaseConfigured()) {
    const sb = await serverClient();
    const { data } = await sb!.auth.getUser();
    if (!data.user) return null;
    const { data: profil } = await sb!
      .from("profiles")
      .select("id, nom, email, telephone, ville, role, verifie")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profil) {
      return {
        id: data.user.id,
        nom: (data.user.user_metadata?.nom as string) ?? data.user.email ?? "Membre",
        email: data.user.email ?? "",
        telephone: (data.user.user_metadata?.telephone as string) ?? "",
        ville: (data.user.user_metadata?.ville as string) ?? "",
        role: (data.user.user_metadata?.role as SessionUser["role"]) ?? "acheteur",
        verifie: false,
      };
    }
    return profil as SessionUser;
  }

  const store = await cookies();
  const uid = verifierJeton(store.get(COOKIE)?.value);
  if (!uid) return null;
  const profil = demoDb().profils.find((p) => p.id === uid);
  return profil ? versSession(profil) : null;
}

export async function exigerRole(roles: SessionUser["role"][]): Promise<SessionUser> {
  const user = await utilisateurCourant();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
