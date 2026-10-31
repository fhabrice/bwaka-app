"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { laisserAvis, ouvrirLitige, type EtatAction } from "@/app/actions";

const INITIAL: EtatAction = {};

function Alerte({ etat }: { etat: EtatAction }) {
  if (etat.erreur) {
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
        {etat.erreur}
      </p>
    );
  }
  if (etat.ok) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700" role="status">
        {etat.message ?? "Enregistré."}
      </p>
    );
  }
  return null;
}

export function FormulaireAvis({
  productId,
  storeId,
  orderId,
  connecte,
}: {
  productId: string;
  storeId: string;
  orderId?: string;
  connecte: boolean;
}) {
  const [etat, action, pending] = useActionState(laisserAvis, INITIAL);
  const [note, setNote] = useState(5);
  const [ouvert, setOuvert] = useState(false);

  if (!connecte) {
    return (
      <p className="rounded-xl bg-sable-100 px-4 py-3 text-xs text-bwaka-950/60">
        <Link href="/connexion" className="font-semibold text-bwaka-800 underline">
          Connectez-vous
        </Link>{" "}
        pour laisser un avis vérifié après votre achat.
      </p>
    );
  }

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="btn-contour btn-sm">
        ✍️ Laisser un avis
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-bwaka-900/10 bg-white p-4">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="store_id" value={storeId} />
      {orderId && <input type="hidden" name="order_id" value={orderId} />}
      <input type="hidden" name="note" value={note} />
      <div>
        <p className="etiquette">Votre note</p>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className={n <= note ? "text-gold-500" : "text-bwaka-900/20"}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="commentaire" className="etiquette">
          Commentaire
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          rows={3}
          required
          placeholder="Qualité du produit, respect du délai, état du colis…"
          className="champ"
        />
      </div>
      <Alerte etat={etat} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primaire btn-sm">
          {pending ? "Publication…" : "Publier mon avis"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="btn-fantome btn-sm">
          Annuler
        </button>
      </div>
    </form>
  );
}

export function FormulaireLitige({ orderId }: { orderId: string }) {
  const [etat, action, pending] = useActionState(ouvrirLitige, INITIAL);
  const [ouvert, setOuvert] = useState(false);

  if (etat.ok) return <Alerte etat={etat} />;

  return (
    <div className="space-y-2">
      {!ouvert ? (
        <button type="button" onClick={() => setOuvert(true)} className="btn-danger btn-sm">
          Signaler un problème
        </button>
      ) : (
        <form action={action} className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
          <input type="hidden" name="order_id" value={orderId} />
          <label htmlFor={`motif-${orderId}`} className="text-xs font-semibold text-rose-800">
            Décrivez le problème rencontré
          </label>
          <textarea
            id={`motif-${orderId}`}
            name="motif"
            rows={3}
            required
            placeholder="Produit non conforme, colis incomplet, retard important…"
            className="champ !border-rose-200"
          />
          <Alerte etat={etat} />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-danger btn-sm">
              {pending ? "Envoi…" : "Ouvrir le litige"}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="btn-fantome btn-sm">
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
