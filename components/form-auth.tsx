"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { connexion, inscription, type EtatAction } from "@/app/actions";
import { QUARTIERS, VILLES } from "@/lib/utils";

const INITIAL: EtatAction = {};

const COMPTES_DEMO = [
  { email: "vendeur@bwaka.cd", role: "Vendeur" },
  { email: "acheteur@bwaka.cd", role: "Acheteur" },
  { email: "livreur@bwaka.cd", role: "Livreur" },
  { email: "admin@bwaka.cd", role: "Admin" },
];

export function FormulaireConnexion({ suite }: { suite?: string }) {
  const [etat, action, pending] = useActionState(connexion, INITIAL);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        {suite && <input type="hidden" name="suite" value={suite} />}
        <div>
          <label htmlFor="email" className="etiquette">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="champ"
            placeholder="vous@exemple.cd"
          />
        </div>
        <div>
          <label htmlFor="motDePasse" className="etiquette">Mot de passe</label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="champ"
            placeholder="••••••"
          />
        </div>

        {etat.erreur && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
            {etat.erreur}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primaire w-full">
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="rounded-xl border border-dashed border-bwaka-900/15 bg-sable-50 p-4">
        <p className="text-[11px] font-bold tracking-wide text-bwaka-950/50 uppercase">
          Comptes de démonstration
        </p>
        <p className="mt-1 text-[11px] text-bwaka-950/45">
          Mot de passe commun : <code className="font-mono font-semibold">demo123</code>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {COMPTES_DEMO.map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => {
                setEmail(c.email);
                setMotDePasse("demo123");
              }}
              className="rounded-lg bg-white px-2.5 py-2 text-left text-[11px] ring-1 ring-bwaka-900/10 transition-colors hover:ring-bwaka-900/30"
            >
              <span className="block font-semibold text-bwaka-900">{c.role}</span>
              <span className="block truncate text-bwaka-950/45">{c.email}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-bwaka-950/55">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-bwaka-800 hover:underline">
          Créer un compte gratuit
        </Link>
      </p>
    </div>
  );
}

export function FormulaireInscription({ roleInitial, suite }: { roleInitial: string; suite?: string }) {
  const [etat, action, pending] = useActionState(inscription, INITIAL);
  const [role, setRole] = useState(roleInitial);
  const [ville, setVille] = useState("Goma");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="suite" value={suite ?? ""} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="ville" value={ville} />

      <div>
        <p className="etiquette">Je m’inscris comme</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { cle: "acheteur", label: "Acheteur", icone: "🛒" },
            { cle: "vendeur", label: "Vendeur", icone: "🏪" },
            { cle: "livreur", label: "Livreur", icone: "🛵" },
          ].map((r) => (
            <button
              key={r.cle}
              type="button"
              onClick={() => setRole(r.cle)}
              className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold transition-all ${
                role === r.cle
                  ? "border-bwaka-900 bg-bwaka-900 text-white"
                  : "border-bwaka-900/15 bg-white text-bwaka-950/70 hover:border-bwaka-900/35"
              }`}
              aria-pressed={role === r.cle}
            >
              <span className="block text-base" aria-hidden>{r.icone}</span>
              <span className="mt-1 block">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nom" className="etiquette">Nom complet</label>
          <input id="nom" name="nom" required autoComplete="name" className="champ" placeholder="Jean Kambale" />
        </div>
        <div>
          <label htmlFor="telephone" className="etiquette">Téléphone</label>
          <input
            id="telephone"
            name="telephone"
            required
            type="tel"
            autoComplete="tel"
            className="champ"
            placeholder="+243 9XX XXX XXX"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email-inscription" className="etiquette">Adresse e-mail</label>
        <input
          id="email-inscription"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="champ"
          placeholder="vous@exemple.cd"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ville" className="etiquette">Ville</label>
          <select
            id="ville"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="champ"
          >
            {VILLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-bwaka-950/40">
            Quartiers : {(QUARTIERS[ville] ?? []).slice(0, 3).join(", ")}…
          </p>
        </div>
        <div>
          <label htmlFor="motDePasse" className="etiquette">Mot de passe</label>
          <input
            id="motDePasse"
            name="motDePasse"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="champ"
            placeholder="6 caractères minimum"
          />
        </div>
      </div>

      {etat.erreur && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
          {etat.erreur}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primaire w-full">
        {pending ? "Création du compte…" : "Créer mon compte gratuit"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-bwaka-950/45">
        En créant un compte, vous acceptez les conditions d’utilisation de BWAKA et le traitement de
        vos données conformément à la législation congolaise. Aucun frais d’inscription.
      </p>

      <p className="text-center text-xs text-bwaka-950/55">
        Déjà membre ?{" "}
        <Link href="/connexion" className="font-semibold text-bwaka-800 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
