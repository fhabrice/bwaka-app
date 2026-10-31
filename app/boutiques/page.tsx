import Link from "next/link";
import type { Metadata } from "next";

import { Etoiles, SectionTitre } from "@/components/ui";
import { listBoutiques, listProduits } from "@/lib/store";

export const metadata: Metadata = { title: "Boutiques vérifiées" };

export default async function PageBoutiques() {
  const [boutiques, produits] = await Promise.all([listBoutiques(), listProduits()]);

  return (
    <div className="conteneur py-10">
      <SectionTitre
        surtitre="Vendeurs"
        titre="Des boutiques identifiées, pas des comptes anonymes"
        texte="Chaque boutique est rattachée à un membre inscrit avec un numéro de téléphone vérifié. Les boutiques marquées « Vérifiée » ont fourni une pièce d’identité et, pour les sociétés, un RCCM."
        action={{ href: "/vendre", label: "Ouvrir ma boutique" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boutiques.map((b) => {
          const articles = produits.filter((p) => p.store_id === b.id);
          return (
            <Link key={b.id} href={`/boutiques/${b.slug}`} className="carte-hover group overflow-hidden">
              <div className="h-24 bg-bwaka-900 grain">
                <div className="flex h-full items-end justify-between px-5 pb-0">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400 text-sm font-black text-bwaka-950 shadow-lg">
                    {b.nom.slice(0, 2).toUpperCase()}
                  </span>
                  {b.verifie && <span className="mb-3 badge bg-white/15 text-white">✓ Vérifiée</span>}
                </div>
              </div>
              <div className="p-5 pt-4">
                <h3 className="text-base font-bold group-hover:text-bwaka-700">{b.nom}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bwaka-950/50">
                  {b.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-bwaka-900/8 pt-3 text-[11px] text-bwaka-950/55">
                  <span className="flex items-center gap-1">
                    <Etoiles note={b.note} /> {b.note || "Nouveau"}
                  </span>
                  <span>{articles.length} produits · {b.ville}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
