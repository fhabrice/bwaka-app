"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface LignePanier {
  produitId: string;
  nom: string;
  prix: number;
  image: string | null;
  quantite: number;
  stock: number;
  boutique: string;
  ville: string;
}

interface PanierContexte {
  lignes: LignePanier[];
  pret: boolean;
  ajouter: (ligne: Omit<LignePanier, "quantite">, quantite?: number) => void;
  retirer: (produitId: string) => void;
  changerQuantite: (produitId: string, quantite: number) => void;
  vider: () => void;
  total: number;
  nombre: number;
}

const CLE = "bwaka.panier.v1";
const Ctx = createContext<PanierContexte | null>(null);

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const [lignes, setLignes] = useState<LignePanier[]>([]);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) setLignes(JSON.parse(brut) as LignePanier[]);
    } catch {
      /* panier illisible : on repart de zéro */
    }
    setPret(true);
  }, []);

  useEffect(() => {
    if (!pret) return;
    localStorage.setItem(CLE, JSON.stringify(lignes));
  }, [lignes, pret]);

  const ajouter = useCallback((ligne: Omit<LignePanier, "quantite">, quantite = 1) => {
    setLignes((prev) => {
      const existante = prev.find((l) => l.produitId === ligne.produitId);
      if (existante) {
        return prev.map((l) =>
          l.produitId === ligne.produitId
            ? { ...l, quantite: Math.min(l.quantite + quantite, l.stock) }
            : l,
        );
      }
      return [...prev, { ...ligne, quantite: Math.min(quantite, ligne.stock) }];
    });
  }, []);

  const retirer = useCallback((produitId: string) => {
    setLignes((prev) => prev.filter((l) => l.produitId !== produitId));
  }, []);

  const changerQuantite = useCallback((produitId: string, quantite: number) => {
    setLignes((prev) =>
      prev
        .map((l) =>
          l.produitId === produitId
            ? { ...l, quantite: Math.max(0, Math.min(quantite, l.stock)) }
            : l,
        )
        .filter((l) => l.quantite > 0),
    );
  }, []);

  const vider = useCallback(() => setLignes([]), []);

  const { total, nombre } = useMemo(
    () => ({
      total: lignes.reduce((s, l) => s + l.prix * l.quantite, 0),
      nombre: lignes.reduce((s, l) => s + l.quantite, 0),
    }),
    [lignes],
  );

  return (
    <Ctx.Provider
      value={{ lignes, pret, ajouter, retirer, changerQuantite, vider, total, nombre }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePanier(): PanierContexte {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePanier doit être utilisé dans <PanierProvider>");
  return ctx;
}
