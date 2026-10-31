"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fc } from "@/lib/utils";
import { usePanier, type LignePanier } from "./panier-provider";

export function AchatProduit({ produit }: { produit: Omit<LignePanier, "quantite"> }) {
  const { ajouter, lignes } = usePanier();
  const router = useRouter();
  const [quantite, setQuantite] = useState(1);
  const [confirmation, setConfirmation] = useState(false);
  const dansLePanier = lignes.find((l) => l.produitId === produit.produitId)?.quantite ?? 0;
  const restant = Math.max(0, produit.stock - dansLePanier);
  const rupture = produit.stock <= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-bwaka-900/15 bg-white">
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.max(1, q - 1))}
            className="px-3.5 py-2 text-lg leading-none text-bwaka-900 hover:text-bwaka-600"
            aria-label="Diminuer la quantité"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
            {quantite}
          </span>
          <button
            type="button"
            onClick={() => setQuantite((q) => Math.min(Math.max(1, restant), q + 1))}
            className="px-3.5 py-2 text-lg leading-none text-bwaka-900 hover:text-bwaka-600"
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>
        <p className="text-xs text-bwaka-950/50">
          Total <span className="font-semibold text-bwaka-900">{fc(produit.prix * quantite)}</span>
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={rupture}
          onClick={() => {
            ajouter(produit, quantite);
            setConfirmation(true);
            setTimeout(() => setConfirmation(false), 1800);
          }}
          className="btn-primaire"
        >
          <span aria-hidden>{confirmation ? "✓" : "🛍️"}</span>
          {confirmation ? "Ajouté au panier" : rupture ? "Rupture de stock" : "Ajouter au panier"}
        </button>
        <button
          type="button"
          disabled={rupture}
          onClick={() => {
            ajouter(produit, quantite);
            router.push("/panier");
          }}
          className="btn-or"
        >
          Acheter maintenant
        </button>
      </div>

      {restant > 0 && restant <= 5 && (
        <p className="text-[11px] font-medium text-gold-600">
          Plus que {restant} exemplaire{restant > 1 ? "s" : ""} en stock chez le vendeur.
        </p>
      )}
      {dansLePanier > 0 && (
        <p className="text-[11px] text-bwaka-950/45">
          Déjà {dansLePanier} dans votre panier.{" "}
          <button type="button" onClick={() => router.push("/panier")} className="font-semibold text-bwaka-700 underline">
            Voir le panier
          </button>
        </p>
      )}
    </div>
  );
}
