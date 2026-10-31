import Link from "next/link";
import type { ProduitAvecBoutique } from "@/lib/types";
import { CATEGORIE_NOM } from "@/lib/demo-data";
import { fc } from "@/lib/utils";
import { BoutonAjout } from "./bouton-ajout";
import { Etoiles, VignetteProduit } from "./ui";

export function ProduitCarte({ produit }: { produit: ProduitAvecBoutique }) {
  return (
    <article className="carte-hover group flex flex-col overflow-hidden">
      <Link href={`/produits/${produit.slug}`} className="relative block">
        <VignetteProduit image={produit.image} nom={produit.nom} className="aspect-[4/3] w-full" />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-bwaka-900 uppercase backdrop-blur">
          {CATEGORIE_NOM[produit.categorie_slug] ?? produit.categorie_slug}
        </span>
        {produit.stock === 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-bwaka-950/85 px-2.5 py-1 text-[10px] font-semibold text-white">
            Rupture
          </span>
        )}
        {produit.stock > 0 && produit.stock <= 5 && (
          <span className="absolute top-3 right-3 rounded-full bg-gold-400 px-2.5 py-1 text-[10px] font-bold text-bwaka-950">
            {produit.stock} restants
          </span>
        )}
        <BoutonAjout
          produit={{
            produitId: produit.id,
            nom: produit.nom,
            prix: produit.prix,
            image: produit.image,
            stock: produit.stock,
            boutique: produit.boutique.nom,
            ville: produit.ville,
          }}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <Link
          href={`/produits/${produit.slug}`}
          className="line-clamp-2 text-sm leading-snug font-semibold text-bwaka-950 hover:text-bwaka-700"
        >
          {produit.nom}
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-bwaka-950/50">
          <Link href={`/boutiques/${produit.boutique.slug}`} className="truncate hover:text-bwaka-700">
            {produit.boutique.nom}
          </Link>
          {produit.boutique.verifie && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-bwaka-100 px-1.5 py-0.5 text-[9px] font-bold text-bwaka-700">
              ✓ Vérifié
            </span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-base font-bold tracking-tight text-bwaka-900 tabular-nums">
            {fc(produit.prix)}
          </span>
          {produit.nombre_avis > 0 ? (
            <span className="flex items-center gap-1 text-[11px] text-bwaka-950/50">
              <Etoiles note={produit.note_moyenne} />
              <span className="tabular-nums">{produit.note_moyenne}</span>
            </span>
          ) : (
            <span className="text-[11px] text-bwaka-950/35">Nouveau</span>
          )}
        </div>
        <p className="text-[11px] text-bwaka-950/40">
          Livraison suivie · {produit.ville}
        </p>
      </div>
    </article>
  );
}
