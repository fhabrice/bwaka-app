import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { BadgeStatut, Stat, Vide } from "@/components/ui";
import { traiterLitige, verifierVendeur } from "@/app/actions";
import {
  listBoutiques,
  listLitiges,
  statsAdmin,
  toutesLesCommandes,
  toutesLesLivraisons,
} from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import { STATUTS_LIVRAISON, STATUTS_SEQUESTRE, dateCourte, fc, OPERATEURS } from "@/lib/utils";

export const metadata: Metadata = { title: "Back-office BWAKA" };

const PROJECTION = [
  { indicateur: "Vendeurs actifs", m3: "150", m6: "450", m12: "1 200" },
  { indicateur: "Commandes / mois", m3: "900", m6: "3 500", m12: "11 000" },
  { indicateur: "Panier moyen", m3: "28 $", m6: "32 $", m12: "38 $" },
  { indicateur: "Volume d’affaires", m3: "25 200 $", m6: "112 000 $", m12: "418 000 $" },
  { indicateur: "Revenu BWAKA", m3: "1 500 $", m6: "8 100 $", m12: "26 800 $" },
  { indicateur: "Résultat estimé", m3: "– 2 300 $", m6: "+ 1 900 $", m12: "+ 14 500 $" },
];

export default async function PageAdmin() {
  const user = await utilisateurCourant();
  if (!user) redirect("/connexion?suite=/admin");
  if (user.role !== "admin") {
    return (
      <div className="conteneur py-16">
        <Vide
          icone="🔐"
          titre="Accès réservé à l’administration BWAKA"
          texte="Ce back-office est réservé aux comptes administrateurs. Connectez-vous avec admin@bwaka.cd (mot de passe demo123) en mode démonstration."
          action={{ href: "/connexion?suite=/admin", label: "Changer de compte" }}
        />
      </div>
    );
  }

  const [stats, commandes, boutiqueList, litiges, livraisons] = await Promise.all([
    statsAdmin(),
    toutesLesCommandes(),
    listBoutiques(),
    listLitiges(),
    toutesLesLivraisons(),
  ]);

  return (
    <div className="conteneur py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="surtitre">Back-office · pilotage</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Tableau de bord BWAKA</h1>
          <p className="mt-1 text-xs text-bwaka-950/50">
            Volumes, commissions, séquestre, vendeurs et litiges en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/produits" className="btn-contour btn-sm">Vue acheteur</Link>
          <Link href="/vendeur" className="btn-fantome btn-sm">Vue vendeur</Link>
        </div>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={fc(stats.volume)} label="Volume d’affaires" detail={`${stats.commandes} commandes`} accent />
        <Stat valeur={fc(stats.commissions)} label="Commissions acquises" detail="4 % sur commandes livrées" />
        <Stat valeur={fc(stats.sequestre)} label="Fonds en séquestre" detail="À libérer après réception" />
        <Stat valeur={stats.litiges} label="Litiges ouverts" detail="Instruction sous 48 h" />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={stats.vendeurs} label="Vendeurs" detail={`${boutiqueList.length} boutiques`} />
        <Stat valeur={stats.acheteurs} label="Acheteurs inscrits" />
        <Stat valeur={stats.livreurs} label="Livreurs actifs" detail={`${livraisons.length} courses`} />
        <Stat valeur={stats.produits} label="Produits au catalogue" />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Commandes récentes</h2>
        <div className="overflow-x-auto rounded-2xl border border-bwaka-900/10 bg-white">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-sable-50 text-[10px] font-semibold tracking-wide text-bwaka-950/45 uppercase">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Séquestre</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bwaka-900/8">
              {commandes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <Link href={`/commande/${c.id}`} className="font-semibold hover:underline">
                      {c.numero}
                    </Link>
                    <p className="text-[10px] text-bwaka-950/40">{dateCourte(c.created_at)}</p>
                  </td>
                  <td className="px-4 py-3 text-bwaka-950/60">{c.acheteur?.nom ?? c.adresse.nom}</td>
                  <td className="px-4 py-3 text-bwaka-950/60">{c.adresse.ville}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: OPERATEURS[c.mode_paiement].couleur }} />
                      {OPERATEURS[c.mode_paiement].court}
                    </span>
                  </td>
                  <td className="px-4 py-3"><BadgeStatut statut={c.statut} /></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUTS_SEQUESTRE[c.sequestre].classe}`}>
                      {STATUTS_SEQUESTRE[c.sequestre].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{fc(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Vérification des vendeurs</h2>
          <ul className="space-y-2">
            {boutiqueList.map((b) => (
              <li key={b.id} className="carte flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.nom}</p>
                  <p className="text-[11px] text-bwaka-950/45">
                    {b.quartier}, {b.ville} · {b.ventes} ventes
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`badge ${b.verifie ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {b.verifie ? "Vérifiée" : "En attente"}
                  </span>
                  <form action={verifierVendeur}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="verifie" value={String(!b.verifie)} />
                    <button type="submit" className="btn-contour btn-sm">
                      {b.verifie ? "Retirer" : "Vérifier"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Litiges</h2>
          {litiges.length === 0 ? (
            <Vide icone="⚖️" titre="Aucun litige ouvert" texte="Les litiges ouverts par les acheteurs apparaissent ici, avec le montant concerné." />
          ) : (
            <ul className="space-y-2">
              {litiges.map((l) => (
                <li key={l.id} className="carte p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold">Commande {l.order_id}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-bwaka-950/55">{l.motif}</p>
                      <p className="mt-1 text-[10px] text-bwaka-950/35">{dateCourte(l.created_at)}</p>
                    </div>
                    <span className={`badge ${l.statut === "resolu" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {l.statut}
                    </span>
                  </div>
                  {l.statut !== "resolu" && l.statut !== "rejete" && (
                    <div className="mt-3 flex gap-2 border-t border-bwaka-900/8 pt-3">
                      <form action={traiterLitige}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="statut" value="resolu" />
                        <button type="submit" className="btn-primaire btn-sm">Rembourser l’acheteur</button>
                      </form>
                      <form action={traiterLitige}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="statut" value="rejete" />
                        <button type="submit" className="btn-danger btn-sm">Rejeter</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Flotte de livraison</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {livraisons.map((l) => (
            <div key={l.id} className="carte p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">{l.order_id}</p>
                <span className={`badge ${STATUTS_LIVRAISON[l.statut].classe}`}>
                  {STATUTS_LIVRAISON[l.statut].label}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-bwaka-950/50">
                {l.zone} · tarif {fc(l.tarif)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-bwaka-900/10 bg-white">
        <div className="border-b border-bwaka-900/8 px-5 py-4">
          <h2 className="text-sm font-bold">Projection de revenus — première année</h2>
          <p className="mt-1 text-[11px] text-bwaka-950/45">
            Hypothèses de travail prudentes issues de la proposition LK-TECH, à ajuster au cadrage.
          </p>
        </div>
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-sable-50 text-[10px] font-semibold tracking-wide text-bwaka-950/45 uppercase">
            <tr>
              <th className="px-5 py-3">Indicateur</th>
              <th className="px-5 py-3 text-right">Mois 3</th>
              <th className="px-5 py-3 text-right">Mois 6</th>
              <th className="px-5 py-3 text-right">Mois 12</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bwaka-900/8">
            {PROJECTION.map((p) => (
              <tr key={p.indicateur}>
                <td className="px-5 py-3 text-bwaka-950/70">{p.indicateur}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.m3}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.m6}</td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">{p.m12}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
