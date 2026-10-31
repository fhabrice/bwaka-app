import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProduitCarte } from "@/components/produit-carte";
import { Etoiles, Vide } from "@/components/ui";
import { getBoutique, produitsDeBoutique } from "@/lib/store";
import { dateCourte } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const boutique = await getBoutique(slug);
  return { title: boutique?.nom ?? "Boutique" };
}

export default async function PageBoutique({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const boutique = await getBoutique(slug);
  if (!boutique) notFound();
  const produits = await produitsDeBoutique(boutique.id);

  return (
    <div>
      <div className="bg-bwaka-950 pb-10 text-white">
        <div className="conteneur pt-8">
          <nav className="mb-6 flex items-center gap-1.5 text-[11px] text-white/40" aria-label="Fil d’Ariane">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <span aria-hidden>/</span>
            <Link href="/boutiques" className="hover:text-white">Boutiques</Link>
            <span aria-hidden>/</span>
            <span className="text-white/70">{boutique.nom}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400 text-base font-black text-bwaka-950">
                {boutique.nom.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{boutique.nom}</h1>
                  {boutique.verifie ? (
                    <span className="badge bg-emerald-400/15 text-emerald-300">✓ Boutique vérifiée</span>
                  ) : (
                    <span className="badge bg-amber-400/15 text-amber-300">Vérification en cours</span>
                  )}
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{boutique.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/45">
                  <span className="flex items-center gap-1">
                    <Etoiles note={boutique.note} /> {boutique.note} / 5
                  </span>
                  <span>📍 {boutique.quartier}, {boutique.ville}</span>
                  <span>🛍️ {boutique.ventes} ventes</span>
                  <span>Membre depuis {dateCourte(boutique.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-[11px] leading-relaxed text-white/55">
              <p className="font-semibold text-white">Paiement protégé par séquestre</p>
              <p className="mt-1 max-w-[220px]">
                BWAKA conserve le montant et ne verse le vendeur qu’après votre confirmation de réception.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="conteneur py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            Catalogue <span className="text-bwaka-950/35">({produits.length})</span>
          </h2>
        </div>
        {produits.length === 0 ? (
          <Vide
            icone="🧺"
            titre="Cette boutique n’a pas encore publié de produit"
            texte="Revenez bientôt : de nouveaux articles arrivent chaque semaine."
            action={{ href: "/produits", label: "Explorer le catalogue" }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((p) => (
              <ProduitCarte key={p.id} produit={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
