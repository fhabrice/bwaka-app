import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import {
  BasculeFormulaire,
  FormulaireBoutique,
  FormulaireProduit,
} from "@/components/form-vendeur";
import { BadgeStatut, Etoiles, Stat, Vide, VignetteProduit } from "@/components/ui";
import { basculerProduit, mettreAJourStatut, supprimerProduit } from "@/app/actions";
import { boutiqueDuVendeur, produitsDeBoutique, statsVendeur, ventesVendeur } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import { dateCourte, fc } from "@/lib/utils";
import { CATEGORIE_NOM } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Espace vendeur" };

const ACTIONS: Record<string, { statut: string; label: string; classe: string }[]> = {
  en_attente: [
    { statut: "confirmee", label: "Confirmer la commande", classe: "btn-primaire btn-sm" },
    { statut: "annulee", label: "Annuler", classe: "btn-danger btn-sm" },
  ],
  confirmee: [
    { statut: "expediee", label: "Confier au livreur", classe: "btn-primaire btn-sm" },
    { statut: "annulee", label: "Annuler", classe: "btn-danger btn-sm" },
  ],
  expediee: [{ statut: "livree", label: "Marquer livrée", classe: "btn-contour btn-sm" }],
};

export default async function PageVendeur() {
  const user = await utilisateurCourant();
  if (!user) redirect("/connexion?suite=/vendeur");

  const boutique = await boutiqueDuVendeur(user.id);

  if (!boutique) {
    return (
      <div className="conteneur py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="surtitre">Espace vendeur</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Ouvrez votre boutique en 10 minutes
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-bwaka-950/55">
              Une fois votre boutique créée, vous pourrez publier vos produits depuis votre téléphone,
              suivre votre stock et recevoir vos paiements mobile money après chaque livraison
              confirmée.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["📸", "Publiez en 2 minutes", "Nom, photo, prix, stock. Modifiable à tout moment."],
                ["📈", "Statistiques en direct", "Produits actifs, commandes, chiffre d’affaires net."],
                ["🔒", "Paiement garanti", "Le séquestre protège la vente : l’argent est déjà encaissé."],
                ["🛵", "Livraison organisée", "Des livreurs BWAKA prennent le relais, avec preuve de livraison."],
              ].map(([icone, titre, texte]) => (
                <div key={titre} className="carte p-4">
                  <span className="text-lg" aria-hidden>{icone}</span>
                  <p className="mt-2 text-xs font-bold">{titre}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-bwaka-950/50">{texte}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-bwaka-900/10 bg-white p-5">
              <p className="text-xs font-bold">Conditions BWAKA</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-bwaka-950/55">
                <li>· Inscription et publication gratuites, aucun abonnement obligatoire.</li>
                <li>· 4 % de commission uniquement sur les commandes livrées.</li>
                <li>· Versement sur votre wallet mobile money sous 48 h après réception.</li>
                <li>· Litiges instruits sous 48 h, montant maintenu en séquestre entre-temps.</li>
              </ul>
            </div>
          </div>

          <div className="carte p-6">
            <h2 className="text-base font-bold">Créer ma boutique</h2>
            <p className="mt-1 mb-4 text-xs text-bwaka-950/50">
              Votre vitrine sera immédiatement visible dans le catalogue.
            </p>
            <FormulaireBoutique villeDefaut={user.ville} />
          </div>
        </div>
      </div>
    );
  }

  const [stats, produits, ventes] = await Promise.all([
    statsVendeur(boutique.id),
    produitsDeBoutique(boutique.id),
    ventesVendeur(boutique.id),
  ]);
  const aTraiter = ventes.filter((c) => ["en_attente", "confirmee", "expediee"].includes(c.statut));

  return (
    <div className="conteneur py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="surtitre">Espace vendeur</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">{boutique.nom}</h1>
            {boutique.verifie ? (
              <span className="badge bg-emerald-50 text-emerald-700">✓ Vérifiée</span>
            ) : (
              <span className="badge bg-amber-50 text-amber-700">Vérification en attente</span>
            )}
          </div>
          <p className="mt-1 text-xs text-bwaka-950/50">
            {boutique.quartier}, {boutique.ville} · {user.nom} · {user.telephone}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/boutiques/${boutique.slug}`} className="btn-contour btn-sm">
            Voir ma vitrine
          </Link>
          <Link href="/produits" className="btn-fantome btn-sm">Catalogue</Link>
        </div>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={stats.produitsActifs} label="Produits en ligne" accent />
        <Stat valeur={stats.commandes} label="Commandes reçues" detail={`${aTraiter.length} à traiter`} />
        <Stat valeur={fc(stats.chiffreAffaires)} label="Chiffre d’affaires" detail={`Commission BWAKA : ${fc(stats.commissions)}`} />
        <Stat valeur={stats.note ? `${stats.note} / 5` : "—"} label="Note de la boutique" detail="Avis vérifiés après livraison" />
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Commandes reçues</h2>
            <span className="text-[11px] text-bwaka-950/45">{aTraiter.length} en attente d’action</span>
          </div>

          {ventes.length === 0 ? (
            <Vide
              icone="🧾"
              titre="Aucune commande pour l’instant"
              texte="Publiez des produits et partagez votre vitrine sur WhatsApp pour recevoir vos premières commandes."
            />
          ) : (
            <ul className="space-y-3">
              {ventes.map((c) => (
                <li key={c.id} className="carte p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/commande/${c.id}`} className="text-sm font-bold hover:underline">
                          {c.numero}
                        </Link>
                        <BadgeStatut statut={c.statut} />
                      </div>
                      <p className="mt-1 text-[11px] text-bwaka-950/45">
                        {dateCourte(c.created_at)} · {c.acheteur?.nom ?? "Client BWAKA"} ·{" "}
                        {c.adresse.quartier}, {c.adresse.ville}
                      </p>
                    </div>
                    <p className="text-base font-bold tabular-nums">
                      {fc(c.items.reduce((s, i) => s + i.prix * i.quantite, 0))}
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {c.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-[11px] text-bwaka-950/60">
                        <span className="h-1 w-1 rounded-full bg-bwaka-900/30" aria-hidden />
                        {item.quantite} × {item.nom}
                      </li>
                    ))}
                  </ul>

                  {(ACTIONS[c.statut] ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-bwaka-900/8 pt-3">
                      {ACTIONS[c.statut].map((a) => (
                        <form key={a.statut} action={mettreAJourStatut}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="statut" value={a.statut} />
                          <button type="submit" className={a.classe}>{a.label}</button>
                        </form>
                      ))}
                      <span className="ml-auto self-center text-[10px] text-bwaka-950/35">
                        🔒 {fc(c.total)} sous séquestre
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="carte p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Nouveau produit</h2>
              <span className="text-[10px] text-bwaka-950/40">{produits.length} publiés</span>
            </div>
            <div className="mt-3">
              <BasculeFormulaire titre="+ Publier un produit">
                <FormulaireProduit villeDefaut={boutique.ville} />
              </BasculeFormulaire>
            </div>
          </div>

          <div className="carte p-5">
            <h2 className="text-sm font-bold">Ma boutique</h2>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-bwaka-950/55">
              <Etoiles note={boutique.note} />
              {boutique.note ? `${boutique.note} / 5` : "Pas encore notée"} · {boutique.ventes} ventes
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-bwaka-950/50">{boutique.description}</p>
            <p className="mt-3 rounded-lg bg-sable-100 px-3 py-2 text-[10px] leading-relaxed text-bwaka-950/50">
              Pour obtenir le badge « Vérifiée », envoyez votre pièce d’identité et votre RCCM à
              verification@bwaka.cd. La vérification prend 48 h.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Mes produits</h2>
          <span className="text-[11px] text-bwaka-950/45">{stats.produitsActifs} actifs / {stats.totalProduits}</span>
        </div>

        {produits.length === 0 ? (
          <Vide
            icone="🪄"
            titre="Votre vitrine est encore vide"
            texte="Publiez votre premier produit : nom, description, prix, stock et une photo."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-bwaka-900/10 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-sable-50 text-[10px] font-semibold tracking-wide text-bwaka-950/45 uppercase">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bwaka-900/8">
                {produits.map((p) => (
                  <tr key={p.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <VignetteProduit image={p.image} nom={p.nom} className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="min-w-0">
                          <Link href={`/produits/${p.slug}`} className="block max-w-[220px] truncate font-semibold hover:underline">
                            {p.nom}
                          </Link>
                          <p className="text-[10px] text-bwaka-950/40">{p.ville}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-bwaka-950/55">
                      {CATEGORIE_NOM[p.categorie_slug]}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fc(p.prix)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${p.stock === 0 ? "text-rose-600" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.statut === "actif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {p.statut === "actif" ? "En ligne" : "Hors ligne"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <form action={basculerProduit}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="statut" value={p.statut} />
                          <button type="submit" className="rounded-lg px-2 py-1 text-[11px] font-medium text-bwaka-700 hover:bg-bwaka-50">
                            {p.statut === "actif" ? "Retirer" : "Publier"}
                          </button>
                        </form>
                        <form action={supprimerProduit}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
