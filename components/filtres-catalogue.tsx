"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { CATEGORIES } from "@/lib/demo-data";
import { VILLES } from "@/lib/utils";

export function FiltresCatalogue({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [recherche, setRecherche] = useState(params.get("q") ?? "");

  const cat = params.get("categorie") ?? "";
  const ville = params.get("ville") ?? "";
  const tri = params.get("tri") ?? "recent";

  const pousser = useCallback(
    (cle: string, valeur: string) => {
      const suivant = new URLSearchParams(params.toString());
      if (valeur) suivant.set(cle, valeur);
      else suivant.delete(cle);
      startTransition(() => router.push(`/produits?${suivant.toString()}`, { scroll: false }));
    },
    [params, router],
  );

  useEffect(() => {
    setRecherche(params.get("q") ?? "");
  }, [params]);

  const actifs = [cat, ville, params.get("q")].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pousser("q", recherche.trim());
        }}
        className="relative"
      >
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un produit, une boutique…"
          className="champ pr-10"
          aria-label="Rechercher"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-bwaka-950/40 hover:bg-bwaka-50 hover:text-bwaka-900"
          aria-label="Lancer la recherche"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      <div>
        <p className="etiquette">Catégories</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => pousser("categorie", "")}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
              !cat ? "bg-bwaka-900 text-white" : "text-bwaka-950/70 hover:bg-white"
            }`}
          >
            <span>Toutes</span>
            <span className={`text-[11px] tabular-nums ${!cat ? "text-white/60" : "text-bwaka-950/35"}`}>
              {total}
            </span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => pousser("categorie", c.slug)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                cat === c.slug ? "bg-bwaka-900 text-white" : "text-bwaka-950/70 hover:bg-white"
              }`}
            >
              <span aria-hidden>{c.icone}</span>
              <span className="flex-1 truncate">{c.nom}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="etiquette">Ville</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => pousser("ville", "")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !ville ? "bg-bwaka-900 text-white" : "bg-white text-bwaka-950/60 ring-1 ring-bwaka-900/10 hover:ring-bwaka-900/30"
            }`}
          >
            Toutes
          </button>
          {VILLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => pousser("ville", v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                ville === v ? "bg-bwaka-900 text-white" : "bg-white text-bwaka-950/60 ring-1 ring-bwaka-900/10 hover:ring-bwaka-900/30"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="etiquette" htmlFor="tri">
          Trier par
        </label>
        <select
          id="tri"
          value={tri}
          onChange={(e) => pousser("tri", e.target.value === "recent" ? "" : e.target.value)}
          className="champ"
        >
          <option value="recent">Nouveautés</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      {actifs > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.push("/produits"))}
          className="btn-fantome btn-sm w-full"
        >
          Réinitialiser les filtres ({actifs})
        </button>
      )}

      {pending && (
        <p className="text-center text-[11px] font-medium text-bwaka-700" aria-live="polite">
          Mise à jour…
        </p>
      )}
    </div>
  );
}
