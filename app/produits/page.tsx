import { Suspense } from "react";
import type { Metadata } from "next";

import { FiltresCatalogue } from "@/components/filtres-catalogue";
import { ProduitCarte } from "@/components/produit-carte";
import { Vide } from "@/components/ui";
import { CATEGORIE_NOM } from "@/lib/demo-data";
import { listProduits } from "@/lib/store";
import type { FiltresCatalogue as Filtres } from "@/lib/types";

export const metadata: Metadata = { title: "Catalogue" };

export default async function PageCatalogue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const lire = (cle: string) => (typeof sp[cle] === "string" ? (sp[cle] as string) : undefined);

  const filtres: Filtres = {
    q: lire("q"),
    categorie: lire("categorie"),
    ville: lire("ville"),
    tri: (lire("tri") as Filtres["tri"]) ?? "recent",
  };

  const [produits, tous] = await Promise.all([listProduits(filtres), listProduits()]);
  const titre = filtres.categorie ? CATEGORIE_NOM[filtres.categorie] ?? "Catalogue" : "Catalogue";

  return (
    <div className="conteneur py-10">
      <header className="mb-8">
        <p className="surtitre">BWAKA · Explorer</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{titre}</h1>
        <p className="mt-2 max-w-2xl text-sm text-bwaka-950/55">
          {produits.length} produit{produits.length > 1 ? "s" : ""} disponible{produits.length > 1 ? "s" : ""}
          {filtres.ville ? ` à ${filtres.ville}` : " dans nos villes couvertes"} · frais de livraison
          affichés avant la commande, paiement mobile money ou à la livraison.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-white" />}>
            <FiltresCatalogue total={tous.length} />
          </Suspense>
        </aside>

        <div>
          {produits.length === 0 ? (
            <Vide
              icone="🔍"
              titre="Aucun produit ne correspond"
              texte="Essayez un autre mot-clé, changez de catégorie ou élargissez la ville."
              action={{ href: "/produits", label: "Voir tout le catalogue" }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {produits.map((p) => (
                <ProduitCarte key={p.id} produit={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
