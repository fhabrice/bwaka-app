import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Stat, Vide } from "@/components/ui";
import { avancerLivraison, prendreMission } from "@/app/actions";
import { getCommande, livraisonsDisponibles, livraisonsLivreur } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import { STATUTS_LIVRAISON, dateHeure, fc } from "@/lib/utils";

export const metadata: Metadata = { title: "Espace livreur" };

export default async function PageLivreur() {
  const user = await utilisateurCourant();
  if (!user) redirect("/connexion?suite=/livreur");

  const [disponibles, mes] = await Promise.all([
    livraisonsDisponibles(),
    livraisonsLivreur(user.id),
  ]);

  const detailDisponibles = await Promise.all(
    disponibles.slice(0, 6).map(async (l) => ({ livraison: l, commande: await getCommande(l.order_id) })),
  );
  const detailMes = await Promise.all(
    mes.map(async (l) => ({ livraison: l, commande: await getCommande(l.order_id) })),
  );

  const enCours = mes.filter((l) => l.statut === "en_route" || l.statut === "assignee");
  const livrees = mes.filter((l) => l.statut === "livree");
  const revenus = livrees.reduce((s, l) => s + l.tarif, 0);

  return (
    <div className="conteneur py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="surtitre">Espace livreur</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Missions de {user.nom.split(" ")[0]}</h1>
          <p className="mt-1 text-xs text-bwaka-950/50">
            {user.ville} · tarif garanti · paiement hebdomadaire
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/livraison" className="btn-contour btn-sm">Zones et tarifs</Link>
        </div>
      </header>

      {user.role !== "livreur" && (
        <p className="mt-5 rounded-xl bg-gold-100 px-4 py-3 text-xs text-bwaka-950/70">
          Vous consultez l’espace livreur avec un compte {user.role}. Pour recevoir des missions
          régulières, créez un compte livreur dédié.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat valeur={disponibles.length} label="Missions disponibles" detail="À proximité immédiate" accent />
        <Stat valeur={enCours.length} label="Missions en cours" />
        <Stat valeur={livrees.length} label="Livraisons terminées" />
        <Stat valeur={fc(revenus)} label="Revenus cumulés" detail="Net livreur, hors pourboires" />
      </div>

      <section className="mt-9">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Missions à prendre</h2>
        {detailDisponibles.length === 0 ? (
          <Vide
            icone="🛵"
            titre="Aucune mission disponible"
            texte="Les nouvelles courses apparaissent ici en temps réel. Restez connecté : les commandes confirmées sont attribuées automatiquement."
            action={{ href: "/livreur", label: "Actualiser" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {detailDisponibles.map(({ livraison, commande }) => (
              <article key={livraison.id} className="carte p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{commande?.numero ?? livraison.order_id}</p>
                    <p className="mt-1 text-[11px] text-bwaka-950/45">
                      {livraison.zone} · {dateHeure(livraison.created_at)}
                    </p>
                  </div>
                  <span className={`badge ${STATUTS_LIVRAISON[livraison.statut].classe}`}>
                    {STATUTS_LIVRAISON[livraison.statut].label}
                  </span>
                </div>

                {commande && (
                  <dl className="mt-3 space-y-1 text-[11px] text-bwaka-950/60">
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-bwaka-950/35">Retrait</dt>
                      <dd>{commande.items.length} article(s) · boutique BWAKA</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-bwaka-950/35">Livraison</dt>
                      <dd>
                        {commande.adresse.quartier}, {commande.adresse.ville}
                        {commande.adresse.indication ? ` — ${commande.adresse.indication}` : ""}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-bwaka-950/35">Client</dt>
                      <dd>{commande.adresse.telephone}</dd>
                    </div>
                  </dl>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-bwaka-900/8 pt-3">
                  <p className="text-sm font-bold tabular-nums">{fc(livraison.tarif)}</p>
                  <form action={prendreMission}>
                    <input type="hidden" name="id" value={livraison.id} />
                    <button type="submit" className="btn-primaire btn-sm">Prendre la mission</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Mes missions</h2>
        {detailMes.length === 0 ? (
          <Vide icone="📭" titre="Aucune mission en cours" texte="Prenez une mission ci-dessus pour commencer." />
        ) : (
          <ul className="space-y-3">
            {detailMes.map(({ livraison, commande }) => (
              <li key={livraison.id} className="carte p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{commande?.numero ?? livraison.order_id}</p>
                    <p className="mt-1 text-[11px] text-bwaka-950/45">
                      {commande?.adresse.quartier}, {commande?.adresse.ville} ·{" "}
                      {commande?.adresse.telephone} · maj {dateHeure(livraison.maj_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${STATUTS_LIVRAISON[livraison.statut].classe}`}>
                      {STATUTS_LIVRAISON[livraison.statut].label}
                    </span>
                    <p className="text-sm font-bold tabular-nums">{fc(livraison.tarif)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-bwaka-900/8 pt-3">
                  {livraison.statut === "assignee" && (
                    <form action={avancerLivraison}>
                      <input type="hidden" name="id" value={livraison.id} />
                      <input type="hidden" name="action" value="demarrer" />
                      <button type="submit" className="btn-primaire btn-sm">Démarrer la course</button>
                    </form>
                  )}
                  {livraison.statut === "en_route" && (
                    <form action={avancerLivraison}>
                      <input type="hidden" name="id" value={livraison.id} />
                      <input type="hidden" name="action" value="livrer" />
                      <button type="submit" className="btn-primaire btn-sm">Confirmer la livraison</button>
                    </form>
                  )}
                  <span className="ml-auto text-[10px] text-bwaka-950/40">
                    Code de réception client : <span className="font-mono font-semibold">{livraison.code}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          ["Tarif garanti", "Le montant de la course est fixé avant la prise de mission, jamais contesté."],
          ["Preuve de livraison", "Code à 6 chiffres ou photo : la livraison est validée sans discussion."],
          ["Paiement hebdomadaire", "Vos revenus sont consolidés chaque semaine sur votre wallet mobile money."],
        ].map(([titre, texte]) => (
          <div key={titre} className="carte p-5">
            <p className="text-xs font-bold">{titre}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-bwaka-950/50">{texte}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
