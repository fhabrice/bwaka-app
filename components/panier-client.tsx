"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import { passerCommande, type EtatCommande } from "@/app/actions";
import { OPERATEURS, QUARTIERS, VILLES, fc, fraisLivraison, COMMISSION_TAUX } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";
import { usePanier } from "./panier-provider";
import { VignetteProduit } from "./ui";

const INITIAL: EtatCommande = {};

export function PanierClient({ user }: { user: SessionUser | null }) {
  const { lignes, pret, retirer, changerQuantite, vider, total } = usePanier();
  const router = useRouter();
  const [etat, action, pending] = useActionState(passerCommande, INITIAL);
  const [ville, setVille] = useState(user?.ville && VILLES.includes(user.ville) ? user.ville : "Goma");
  const [quartier, setQuartier] = useState(QUARTIERS[user?.ville ?? "Goma"]?.[0] ?? "Katindo");
  const [paiement, setPaiement] = useState("m_pesa");

  const livraison = useMemo(() => fraisLivraison(ville, quartier), [ville, quartier]);
  const commission = Math.round(total * COMMISSION_TAUX);

  useEffect(() => {
    if (etat.ok && etat.id) {
      vider();
      router.push(`/commande/${etat.id}`);
    }
  }, [etat.ok, etat.id, router, vider]);

  if (!pret) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" />;
  }

  if (lignes.length === 0) {
    return (
      <div className="carte flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="text-4xl" aria-hidden>🧺</span>
        <h2 className="text-lg font-bold">Votre panier est vide</h2>
        <p className="max-w-sm text-sm text-bwaka-950/55">
          Parcourez le catalogue et ajoutez vos produits. Vous pouvez commander chez plusieurs
          vendeurs dans un seul panier.
        </p>
        <Link href="/produits" className="btn-primaire btn-sm mt-2">
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-3">
        {lignes.map((ligne) => (
          <article key={ligne.produitId} className="carte flex gap-4 p-3 sm:p-4">
            <VignetteProduit
              image={ligne.image}
              nom={ligne.nom}
              className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-bwaka-700">{ligne.boutique}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold">{ligne.nom}</h3>
                  <p className="mt-1 text-[11px] text-bwaka-950/40">Vendu et livré depuis {ligne.ville}</p>
                </div>
                <button
                  type="button"
                  onClick={() => retirer(ligne.produitId)}
                  className="shrink-0 rounded-lg p-1.5 text-bwaka-950/30 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Retirer ${ligne.nom}`}
                >
                  ✕
                </button>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="inline-flex items-center rounded-full border border-bwaka-900/15">
                  <button
                    type="button"
                    onClick={() => changerQuantite(ligne.produitId, ligne.quantite - 1)}
                    className="px-3 py-1.5 text-sm text-bwaka-900 hover:text-bwaka-600"
                    aria-label="Diminuer"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-xs font-semibold tabular-nums">
                    {ligne.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => changerQuantite(ligne.produitId, ligne.quantite + 1)}
                    className="px-3 py-1.5 text-sm text-bwaka-900 hover:text-bwaka-600"
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-bold tabular-nums">{fc(ligne.prix * ligne.quantite)}</p>
              </div>
            </div>
          </article>
        ))}

        <div className="carte flex items-center justify-between p-4 text-xs text-bwaka-950/50">
          <span>
            {lignes.length} article{lignes.length > 1 ? "s" : ""} ·{" "}
            {new Set(lignes.map((l) => l.boutique)).size} boutique
            {new Set(lignes.map((l) => l.boutique)).size > 1 ? "s" : ""}
          </span>
          <button type="button" onClick={vider} className="font-semibold text-rose-600 hover:underline">
            Vider le panier
          </button>
        </div>
      </div>

      <form action={action} className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <input
          type="hidden"
          name="lignes"
          value={JSON.stringify(
            lignes.map((l) => ({ produitId: l.produitId, quantite: l.quantite })),
          )}
        />

        <div className="carte p-5">
          <h2 className="text-sm font-bold">Adresse de livraison</h2>
          {!user && (
            <p className="mt-2 rounded-lg bg-gold-100 px-3 py-2 text-[11px] text-bwaka-950/70">
              <Link href="/connexion?suite=/panier" className="font-semibold underline">
                Connectez-vous
              </Link>{" "}
              pour enregistrer votre commande en toute sécurité.
            </p>
          )}
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="nom" className="etiquette">Nom du destinataire</label>
                <input
                  id="nom"
                  name="nom"
                  required
                  defaultValue={user?.nom ?? ""}
                  className="champ"
                  placeholder="Jean Kambale"
                />
              </div>
              <div>
                <label htmlFor="telephone" className="etiquette">Téléphone</label>
                <input
                  id="telephone"
                  name="telephone"
                  required
                  type="tel"
                  defaultValue={user?.telephone ?? ""}
                  className="champ"
                  placeholder="+243 9XX XXX XXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ville" className="etiquette">Ville</label>
              <select
                id="ville"
                name="ville"
                value={ville}
                onChange={(e) => {
                  setVille(e.target.value);
                  setQuartier(QUARTIERS[e.target.value]?.[0] ?? "");
                }}
                className="champ"
              >
                {VILLES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quartier" className="etiquette">Quartier</label>
              <select
                id="quartier"
                name="quartier"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                className="champ"
              >
                {(QUARTIERS[ville] ?? []).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="indication" className="etiquette">Indication (facultatif)</label>
              <input
                id="indication"
                name="indication"
                className="champ"
                placeholder="Portail vert, près de la paroisse…"
              />
            </div>
          </div>
        </div>

        <div className="carte p-5">
          <h2 className="text-sm font-bold">Moyen de paiement</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(OPERATEURS).map(([cle, op]) => (
              <label
                key={cle}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  paiement === cle
                    ? "border-bwaka-900 bg-bwaka-50"
                    : "border-bwaka-900/12 hover:border-bwaka-900/30"
                }`}
              >
                <input
                  type="radio"
                  name="mode_paiement"
                  value={cle}
                  checked={paiement === cle}
                  onChange={() => setPaiement(cle)}
                  className="sr-only"
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: op.couleur }} />
                <span className="flex-1 text-xs font-medium">{op.nom}</span>
                {paiement === cle && <span className="text-xs font-bold text-bwaka-900">✓</span>}
              </label>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] leading-relaxed text-emerald-800">
            🔒 Votre paiement est conservé en séquestre par BWAKA. Le vendeur n’est payé qu’après
            votre confirmation de réception.
          </p>
        </div>

        <div className="carte p-5">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between text-bwaka-950/60">
              <dt>Sous-total ({lignes.length} article{lignes.length > 1 ? "s" : ""})</dt>
              <dd className="tabular-nums">{fc(total)}</dd>
            </div>
            <div className="flex justify-between text-bwaka-950/60">
              <dt>Frais de livraison · {quartier}</dt>
              <dd className="tabular-nums">{fc(livraison)}</dd>
            </div>
            <div className="flex justify-between text-[10px] text-bwaka-950/35">
              <dt>Commission vendeur retenue par BWAKA</dt>
              <dd className="tabular-nums">{fc(commission)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-dashed border-bwaka-900/12 pt-3 text-base font-bold">
              <dt>Total à payer</dt>
              <dd className="tabular-nums">{fc(total + livraison)}</dd>
            </div>
          </dl>

          {etat.erreur && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700" role="alert">
              {etat.erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !user}
            className="btn-primaire mt-4 w-full"
          >
            {pending ? "Traitement…" : user ? "Confirmer la commande" : "Connectez-vous pour commander"}
          </button>
          <p className="mt-2 text-center text-[10px] text-bwaka-950/40">
            Vous recevrez un SMS de confirmation. Aucun prélèvement sans validation.
          </p>
        </div>
      </form>
    </div>
  );
}
