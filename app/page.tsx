import Link from "next/link";
import type { Metadata } from "next";

import { ProduitCarte } from "@/components/produit-carte";
import { Etoiles, SectionTitre } from "@/components/ui";
import { CATEGORIES } from "@/lib/demo-data";
import { listBoutiques, listProduits } from "@/lib/store";
import { fc, OPERATEURS } from "@/lib/utils";

export const metadata: Metadata = {
  title: "BWAKA — Le commerce en ligne, enfin pensé pour la RDC",
};

const MARCHE = [
  { valeur: "73,9 M", label: "abonnements mobiles actifs", detail: "65,9 % de pénétration (ARPTC, T4 2025)" },
  { valeur: "34,3 M", label: "comptes mobile money", detail: "30,6 % de la population" },
  { valeur: "4", label: "opérateurs mobile money", detail: "M-Pesa · Orange · Airtel · Afrimoney" },
  { valeur: "33 %", label: "pénétration internet mobile", detail: "Usage massivement mobile-first" },
];

const PARCOURS = [
  { n: "01", titre: "Commande", texte: "L’acheteur choisit ses produits et son mode de livraison, frais affichés avant validation." },
  { n: "02", titre: "Paiement bloqué", texte: "Le montant est encaissé en mobile money et conservé en séquestre par BWAKA." },
  { n: "03", titre: "Livraison suivie", texte: "Un livreur est assigné, le colis est géolocalisé, le tarif est garanti." },
  { n: "04", titre: "Confirmation", texte: "L’acheteur valide la réception par code à 6 chiffres ou photo." },
  { n: "05", titre: "Versement", texte: "Le vendeur est payé, la commission BWAKA est retenue automatiquement." },
];

const ESPACES = [
  {
    numero: "Espace 01",
    titre: "Le vendeur",
    icone: "🏪",
    avant: ["Photos et prix envoyés en désordre", "Paiements à vérifier un par un", "Stock inconnu, ventes non tracées"],
    apres: ["Boutique en ligne en 10 minutes", "Encaissement mobile money automatique", "Stock, marges et statistiques en temps réel"],
    href: "/vendre",
    cta: "Ouvrir ma boutique",
  },
  {
    numero: "Espace 02",
    titre: "L’acheteur",
    icone: "🛒",
    avant: ["Payer à l’aveugle, sans recours", "Négocier chaque livraison par téléphone", "Aucune garantie de remboursement"],
    apres: ["Argent bloqué jusqu’à réception", "Livraison suivie, prix annoncé à l’avance", "Avis vérifiés, litiges et remboursements"],
    href: "/produits",
    cta: "Explorer le catalogue",
  },
  {
    numero: "Espace 03",
    titre: "Le livreur",
    icone: "🛵",
    avant: ["Courses trouvées au hasard", "Adresses introuvables, revenus imprévisibles", "Paiement parfois contesté"],
    apres: ["Missions proposées automatiquement", "Itinéraire optimisé, tarif garanti", "Revenus suivis, paiement hebdomadaire"],
    href: "/livreur",
    cta: "Devenir livreur",
  },
];

export default async function Accueil() {
  const [produits, boutiques] = await Promise.all([listProduits(), listBoutiques()]);
  const enAvant = produits.slice(0, 8);
  const meilleuresBoutiques = [...boutiques].sort((a, b) => b.note - a.note).slice(0, 3);

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-bwaka-950 text-white">
        <div className="absolute inset-0 grain opacity-40" aria-hidden />
        <div
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-bwaka-700/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="conteneur relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="anim-monte">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white/80 backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400" />
              LK-TECH · LinkSmartec Sarl · Goma, RD Congo
            </div>

            <h1 className="mt-6 text-4xl leading-[1.05] font-black tracking-tight sm:text-5xl lg:text-[56px]">
              Le commerce en ligne,
              <br />
              <span className="text-gold-400">enfin pensé</span> pour la RDC.
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/65">
              Une seule plateforme pour vendre, payer en mobile money, livrer et être payé en toute
              confiance — conçue pour les réalités congolaises : téléphone d’abord, réseau instable,
              paiement mobile.
            </p>

            <form action="/produits" className="mt-8 max-w-xl">
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 px-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-bwaka-950/40">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    name="q"
                    placeholder="Téléphone, café du Kivu, robe en wax…"
                    className="w-full bg-transparent py-2.5 text-sm text-bwaka-950 placeholder:text-bwaka-950/40 focus:outline-none"
                    aria-label="Rechercher un produit"
                  />
                </div>
                <button type="submit" className="btn-or shrink-0">
                  Rechercher
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/45">
              <span>Tendances :</span>
              {["Smartphone", "Café du Kivu", "Kit solaire", "Wax"].map((t) => (
                <Link
                  key={t}
                  href={`/produits?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-white/60 transition-colors hover:border-gold-400/40 hover:text-gold-400"
                >
                  {t}
                </Link>
              ))}
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { k: "Séquestre", v: "Argent bloqué" },
                { k: "4 opérateurs", v: "Mobile money" },
                { k: "Suivi", v: "Colis géolocalisé" },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="text-[11px] font-semibold tracking-wide text-gold-400 uppercase">
                    {item.k}
                  </dt>
                  <dd className="mt-1 text-xs text-white/55">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="anim-apparait delai-2 relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero.jpg"
                alt="Marché congolais — commerce de proximité à Goma"
                className="aspect-[4/3] w-full object-cover object-[68%_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bwaka-950/80 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-6 -left-4 w-64 rounded-2xl border border-white/15 bg-white p-4 text-bwaka-950 shadow-2xl sm:-left-8">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm">
                  🔒
                </span>
                <div>
                  <p className="text-[11px] font-bold text-emerald-700">Argent en séquestre</p>
                  <p className="text-[10px] text-bwaka-950/50">Libéré à la réception</p>
                </div>
              </div>
              <p className="mt-3 text-lg font-bold tracking-tight tabular-nums">{fc(387500)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bwaka-900/10">
                <div className="h-full w-3/4 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="absolute -top-4 -right-2 rounded-2xl border border-white/15 bg-white/95 px-3.5 py-3 text-bwaka-950 shadow-2xl sm:-right-6">
              <p className="text-[10px] font-semibold tracking-wide text-bwaka-950/50 uppercase">
                Livreur en route
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Katindo · 8 min
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- CHIFFRES */}
      <section className="border-b border-bwaka-900/8 bg-white">
        <div className="conteneur grid grid-cols-2 divide-bwaka-900/8 py-8 sm:divide-x lg:grid-cols-4">
          {MARCHE.map((m) => (
            <div key={m.label} className="px-2 py-3 sm:px-6">
              <p className="text-2xl font-black tracking-tight text-bwaka-900 sm:text-3xl">{m.valeur}</p>
              <p className="mt-1 text-xs font-medium text-bwaka-950/60">{m.label}</p>
              <p className="mt-1 text-[10px] text-bwaka-950/35">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- CATÉGORIES */}
      <section className="conteneur py-14">
        <SectionTitre
          surtitre="Explorer"
          titre="Tout ce qui se vend à Goma, Bukavu et Kinshasa"
          texte="Huit familles de produits, des boutiques vérifiées, des frais de livraison annoncés avant d’acheter."
          action={{ href: "/produits", label: "Voir le catalogue complet" }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/produits?categorie=${cat.slug}`}
              className={`group carte-hover anim-monte delai-${(i % 4) + 1} flex items-center gap-3 p-4`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sable-100 text-lg transition-colors group-hover:bg-gold-100">
                {cat.icone}
              </span>
              <span className="text-sm font-semibold text-bwaka-950 group-hover:text-bwaka-700">
                {cat.nom}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- PRODUITS */}
      <section className="conteneur pb-14">
        <SectionTitre
          surtitre="Sélection du jour"
          titre="Les produits que les Congolais achètent en ce moment"
          action={{ href: "/produits", label: `Tous les ${produits.length} produits` }}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {enAvant.map((p) => (
            <ProduitCarte key={p.id} produit={p} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- PARCOURS */}
      <section id="parcours" className="bg-bwaka-950 py-16 text-white">
        <div className="conteneur">
          <div className="max-w-2xl">
            <p className="surtitre !text-gold-400">Le parcours, de bout en bout</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Cinq étapes entre la commande et le versement au vendeur
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              L’argent ne se libère qu’une fois le produit reçu. C’est le pilier de la confiance :
              aucune pièce du parcours ne peut manquer.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PARCOURS.map((etape, i) => (
              <li
                key={etape.n}
                className={`relative rounded-2xl border p-5 transition-colors ${
                  i === 4
                    ? "border-gold-400/40 bg-gold-400/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <span className={`text-[11px] font-black tracking-widest ${i === 4 ? "text-gold-400" : "text-white/35"}`}>
                  {etape.n}
                </span>
                <h3 className="mt-3 text-sm font-bold">{etape.titre}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-white/50">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- ESPACES */}
      <section className="conteneur py-16">
        <SectionTitre
          surtitre="Une application, trois métiers"
          titre="Un espace pour chaque acteur du marché"
          texte="BWAKA n’est pas une boutique en ligne de plus : c’est l’infrastructure de confiance du commerce congolais."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {ESPACES.map((espace) => (
            <article key={espace.titre} className="carte flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{espace.icone}</span>
                <span className="text-[10px] font-bold tracking-[0.16em] text-bwaka-950/35 uppercase">
                  {espace.numero}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold tracking-tight">{espace.titre}</h3>

              <div className="mt-5 space-y-3 text-[12px]">
                <div>
                  <p className="mb-1.5 font-semibold tracking-wide text-rose-600/70 uppercase">Aujourd’hui</p>
                  <ul className="space-y-1.5 text-bwaka-950/45">
                    {espace.avant.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span aria-hidden>✕</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-dashed border-bwaka-900/12 pt-3">
                  <p className="mb-1.5 font-semibold tracking-wide text-emerald-700 uppercase">Avec BWAKA</p>
                  <ul className="space-y-1.5 text-bwaka-950/70">
                    {espace.apres.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="text-emerald-600" aria-hidden>✓</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link href={espace.href} className="btn-contour btn-sm mt-6 self-start">
                {espace.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- BOUTIQUES */}
      <section className="conteneur pb-16">
        <SectionTitre
          surtitre="Boutiques"
          titre="Des vendeurs identifiés, des avis authentifiés"
          texte="Chaque boutique est rattachée à un membre inscrit. La vérification d’identité et le RCCM sont contrôlés par BWAKA."
          action={{ href: "/boutiques", label: "Toutes les boutiques" }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {meilleuresBoutiques.map((b) => (
            <Link key={b.id} href={`/boutiques/${b.slug}`} className="carte-hover group p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bwaka-900 text-sm font-black text-gold-400">
                  {b.nom.slice(0, 2).toUpperCase()}
                </div>
                {b.verifie ? (
                  <span className="badge bg-bwaka-100 text-bwaka-700">✓ Vérifiée</span>
                ) : (
                  <span className="badge bg-amber-50 text-amber-700">En vérification</span>
                )}
              </div>
              <h3 className="mt-4 text-base font-bold group-hover:text-bwaka-700">{b.nom}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bwaka-950/50">{b.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-bwaka-900/8 pt-3 text-[11px] text-bwaka-950/50">
                <span className="flex items-center gap-1">
                  <Etoiles note={b.note} /> {b.note}
                </span>
                <span>{b.ventes} ventes · {b.ville}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ CONTRAINTES RDC */}
      <section className="conteneur pb-16">
        <div className="carte grid gap-px overflow-hidden bg-bwaka-900/8 sm:grid-cols-3">
          {[
            { icone: "📶", titre: "Fonctionne hors ligne", texte: "Catalogue en cache, commandes mises en attente puis envoyées dès le retour du réseau." },
            { icone: "✉️", titre: "SMS et USSD de secours", texte: "Commander et confirmer sans application ni forfait data, depuis n’importe quel téléphone." },
            { icone: "🌍", titre: "Français · Swahili · Lingala", texte: "Interface multilingue dès la première version, pensée pour le téléphone d’entrée de gamme." },
          ].map((item) => (
            <div key={item.titre} className="bg-white p-6">
              <span className="text-xl" aria-hidden>{item.icone}</span>
              <h3 className="mt-3 text-sm font-bold">{item.titre}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-bwaka-950/50">{item.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="conteneur pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-bwaka-900 px-6 py-12 text-white sm:px-12">
          <div className="absolute inset-0 grain opacity-30" aria-hidden />
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="surtitre !text-gold-400">Espace vendeur ouvert à tous</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Votre boutique en ligne en 10 minutes
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Inscrivez-vous gratuitement, publiez vos produits depuis votre téléphone et
                encaissez par M-Pesa, Orange Money, Airtel Money ou Afrimoney. BWAKA retient 4 % de
                commission sur les ventes abouties — rien d’autre.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {Object.entries(OPERATEURS).slice(0, 4).map(([cle, op]) => (
                  <span
                    key={cle}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/70"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: op.couleur }} />
                    {op.court}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Link href="/inscription?role=vendeur" className="btn-or w-full">
                Créer ma boutique gratuitement
              </Link>
              <Link href="/vendre" className="btn w-full border border-white/20 text-white hover:bg-white/10">
                Comment ça marche ?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
