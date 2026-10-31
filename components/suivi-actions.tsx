"use client";

import { useActionState, useState } from "react";

import { confirmerReception, type EtatAction } from "@/app/actions";

const INITIAL: EtatAction = {};

export function ConfirmerReception({ orderId, code }: { orderId: string; code: string }) {
  const [etat, action, pending] = useActionState(confirmerReception, INITIAL);
  const [valeur, setValeur] = useState("");

  if (etat.ok) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-xs font-medium text-emerald-800" role="status">
        {etat.message ?? "Réception confirmée."}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-bwaka-900/10 bg-white p-4">
      <input type="hidden" name="id" value={orderId} />
      <div>
        <p className="text-xs font-bold">Confirmer la réception</p>
        <p className="mt-1 text-[11px] leading-relaxed text-bwaka-950/50">
          Saisissez le code à 6 chiffres reçu par SMS (ou communiqué par le livreur) pour libérer le
          versement au vendeur.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          name="code"
          value={valeur}
          onChange={(e) => setValeur(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="• • • • • •"
          className="champ font-mono tracking-[0.3em]"
          aria-label="Code de confirmation à 6 chiffres"
        />
        <button type="submit" disabled={pending} className="btn-primaire shrink-0">
          {pending ? "…" : "Confirmer"}
        </button>
      </div>
      <p className="text-[10px] text-bwaka-950/35">
        Code de cette commande : <span className="font-mono font-semibold">{code}</span>
      </p>
      {etat.erreur && (
        <p className="text-[11px] font-medium text-rose-600" role="alert">
          {etat.erreur}
        </p>
      )}
    </form>
  );
}
