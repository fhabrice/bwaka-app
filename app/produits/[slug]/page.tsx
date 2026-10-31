import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AchatProduit } from "@/components/achat-produit";
import { FormulaireAvis } from "@/components/formulaires";
import { ProduitCarte } from "@/components/produit-carte";
import { Etoiles, VignetteProduit } from "@/components/ui";
import { CATEGORIE_NOM } from "@/lib/demo-data";
import { avisDuProduit, getProduit, listProduits } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import { depuis, fc, fraisLivraison, ZONES_LIVRAISON } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produit = await getProduit(slug);
  if (!produit) return { title: "Produit introuvable" };
  return {
    title: produit.nom,
    description: produit.description.slice(0, 155),
    openGraph: { images: produit.image ? [produit.image] : [] },
  };
}

export default async function PageProduit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const produit = await getProduit(slug);
  if (!produit) notFound();

  const [avis, tous, user] = await Promise.all([
    avisDuProduit(produit.id),
    listProduits({ categorie: produit.categorie_slug }),
    utilisateurCourant(),
  ]);
  const similaires = tous.filter((p) => p.id !== produit.id).slice(0, 4);
  const livraison = fraisLivraison(produit.ville, "");

  return (
    <div className="conteneur py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-bwaka-950/45" aria-label="Fil d’Ariane">
        <Link href="/" className="hover:text-bwaka-900">Accueil</Link>
        <span aria-hidden>/</span>
        <Link href="/produits" className="hover:text-bwaka-900">Catalogue</Link>
        <span aria-hidden>/</span>
        <Link href={`/produits?categorie=${produit.categorie_slug}`} className="hover:text-bwaka-900">
          {CATEGORIE_NOM[produit.categorie_slug]}
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-bwaka-950/70">{produit.nom}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <VignetteProduit
            image={produit.image}
            nom={produit.nom}
            className="aspect-square w-full rounded-3xl"
          />
          <div className="grid grid-cols-4 gap-2">
            {[produit.image, "/images/hero.jpg", produit.image, "/images/hero.jpg"].map((img, i) => (
              <VignetteProduit
                key={i}
                image={img}
                nom={`${produit.nom} — vue ${i + 1}`}
                className={`aspect-square rounded-xl ${i === 0 ? "ring-2 ring-bwaka-900" : "opacity-70"}`}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-sable-100 text-bwaka-800">
              {CATEGORIE_NOM[produit.categorie_slug]}
            </span>
            {produit.boutique.verifie && (
              <span className="badge bg-emerald-50 text-emerald-700">✓ Boutique vérifiée</span>
            )}
            <span className="badge bg-bwaka-50 text-bwaka-700">📍 {produit.ville}</span>
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{produit.nom}</h1>

          <div className="mt-2 flex items-center gap-3 text-xs text-bwaka-950/55">
            <span className="flex items-center gap-1">
              <Etoiles note={produit.note_moyenne} />
              <span className="font-semibold text-bwaka-900">
                {produit.note_moyenne || "—"}
              </span>
              <span>({produit.nombre_avis} avis)</span>
            </span>
            <span aria-hidden>·</span>
            <Link href={`/boutiques/${produit.boutique.slug}`} className="font-medium hover:text-bwaka-700">
              {produit.boutique.nom}
            </Link>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-black tracking-tight text-bwaka-900 tabular-nums">
              {fc(produit.prix)}
            </p>
            {produit.stock > 0 ? (
              <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En stock ({produit.stock})
              </span>
            ) : (
              <span className="mb-1 text-[11px] font-semibold text-rose-600">Rupture de stock</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-bwaka-950/65">{produit.description}</p>

          <div className="mt-6">
            <AchatProduit
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
          </div>

          <dl className="mt-6 grid gap-3 rounded-2xl border border-bwaka-900/10 bg-white p-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="text-lg" aria-hidden>🔒</span>
              <div>
                <dt className="text-xs font-bold">Paiement en séquestre</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-bwaka-950/50">
                  Votre argent est bloqué jusqu’à confirmation de réception.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg" aria-hidden>🛵</span>
              <div>
                <dt className="text-xs font-bold">Livraison suivie</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-bwaka-950/50">
                  Dès {fc(livraison)} · {ZONES_LIVRAISON[1].delai} à {produit.ville}. Livreur joignable.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg" aria-hidden>↩️</span>
              <div>
                <dt className="text-xs font-bold">Litige et remboursement</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-bwaka-950/50">
                  Produit non conforme ? Ouvrez un litige dans les 48 h.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg" aria-hidden>📱</span>
              <div>
                <dt className="text-xs font-bold">Mobile money</dt>
                <dd className="mt-0.5 text-[11px] leading-relaxed text-bwaka-950/50">
                  M-Pesa, Orange, Airtel, Afrimoney ou paiement à la livraison.
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              Avis vérifiés <span className="text-bwaka-950/35">({avis.length})</span>
            </h2>
            <FormulaireAvis
              productId={produit.id}
              storeId={produit.store_id}
              connecte={Boolean(user)}
            />
          </div>

          <ul className="mt-5 space-y-3">
            {avis.length === 0 && (
              <li className="carte p-6 text-sm text-bwaka-950/50">
                Aucun avis pour ce produit. Les avis ne peuvent être déposés qu’après un achat livré.
              </li>
            )}
            {avis.map((a) => (
              <li key={a.id} className="carte p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bwaka-100 text-[11px] font-bold text-bwaka-800">
                      {a.auteur_nom.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{a.auteur_nom}</p>
                      <p className="text-[10px] text-bwaka-950/40">
                        Achat vérifié · {depuis(a.created_at)}
                      </p>
                    </div>
                  </div>
                  <Etoiles note={a.note} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-bwaka-950/70">{a.commentaire}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-3">
          <div className="carte p-5">
            <h3 className="text-sm font-bold">Vendu par</h3>
            <Link href={`/boutiques/${produit.boutique.slug}`} className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-bwaka-900 text-xs font-black text-gold-400">
                {produit.boutique.nom.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold">{produit.boutique.nom}</p>
                <p className="flex items-center gap-1 text-[11px] text-bwaka-950/50">
                  <Etoiles note={produit.boutique.note} /> {produit.boutique.note} · {produit.boutique.ville}
                </p>
              </div>
            </Link>
            <Link href={`/boutiques/${produit.boutique.slug}`} className="btn-contour btn-sm mt-4 w-full">
              Visiter la boutique
            </Link>
          </div>

          <div className="carte bg-bwaka-900 p-5 text-white">
            <p className="text-[11px] font-bold tracking-wide text-gold-400 uppercase">Livraison</p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              Tarif annoncé à l’avance, calculé par zone. Le livreur vous appelle avant de livrer.
            </p>
            <Link href="/livraison" className="mt-3 inline-block text-xs font-semibold text-gold-400 hover:underline">
              Voir les zones et tarifs →
            </Link>
          </div>
        </aside>
      </div>

      {similaires.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold tracking-tight">Dans la même catégorie</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similaires.map((p) => (
              <ProduitCarte key={p.id} produit={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
