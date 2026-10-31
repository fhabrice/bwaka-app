"use client";

import { useState } from "react";
import { usePanier, type LignePanier } from "./panier-provider";

export function BoutonAjout({
  produit,
  quantite = 1,
  variante = "icone",
  libelle = "Ajouter au panier",
}: {
  produit: Omit<LignePanier, "quantite">;
  quantite?: number;
  variante?: "icone" | "plein" | "contour";
  libelle?: string;
}) {
  const { ajouter } = usePanier();
  const [ajoute, setAjoute] = useState(false);

  const classes =
    variante === "icone"
      ? "absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-bwaka-900 shadow-md ring-1 ring-bwaka-900/10 transition-all hover:bg-bwaka-900 hover:text-white"
      : variante === "plein"
        ? "btn-primaire w-full"
        : "btn-contour w-full";

  const indisponible = produit.stock <= 0;

  return (
    <button
      type="button"
      disabled={indisponible}
      aria-label={indisponible ? "Produit en rupture de stock" : libelle}
      onClick={() => {
        ajouter(produit, quantite);
        setAjoute(true);
        setTimeout(() => setAjoute(false), 1600);
      }}
      className={`${classes} ${ajoute ? "!bg-emerald-600 !text-white" : ""} disabled:opacity-40`}
    >
      {variante === "icone" ? (
        <span className="text-sm" aria-hidden>
          {ajoute ? "✓" : indisponible ? "✕" : "+"}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden>{ajoute ? "✓" : "🛍️"}</span>
          {ajoute ? "Ajouté au panier" : indisponible ? "Rupture de stock" : libelle}
        </span>
      )}
    </button>
  );
}
