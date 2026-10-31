import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { BadgeStatut, Stat, VignetteProduit, Vide } from "@/components/ui";
import { commandesAcheteur } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import { dateCourte, fc, OPERATEURS } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageCompte() {
  const user = await utilisateurCourant();
  if (!user) redirect("/connexion?suite=/compte");

  const commandes = await commandesAcheteur(user.id);
  const depense = commandes
    .filter((c) => c.statut !== "annulee")
    .reduce((s, c) => s + c.total, 0);
  const enCours = commandes.filter((c) => ["en_attente", "confirmee", "expediee"].includes(c.statut));

  return (
    <div className="conteneur py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="surtitre">Espace acheteur</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Bonjour {user.nom.split(" ")[0]}</h1>
          <p className="mt-1 text-xs text-bwaka-950/50">
            {user.email} · {user.telephone} · {user.ville}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/produits" className="btn-contour btn-sm">Continuer mes achats</Link>
          <Link href="/vendeur" className="btn-primaire btn-sm">Espace vendeur</Link>
        </div>
      </header>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Stat valeur={commandes.length} label="Commandes passées" accent />
        <Stat valeur={enCours.length} label="En cours de livraison" detail="Suivi en temps réel" />
        <Stat valeur={fc(depense)} label="Total dépensé" detail="Toutes commandes non annulées" />
      </div>

      <section className="mt-9">
        <h2 className="mb-4 text-lg font-bold tracking-tight">Mes commandes</h2>
        {commandes.length === 0 ? (
          <Vide
            icone="📦"
            titre="Aucune commande pour l’instant"
            texte="Votre première commande sera protégée par le séquestre BWAKA jusqu’à la réception."
            action={{ href: "/produits", label: "Explorer le catalogue" }}
          />
        ) : (
          <ul className="space-y-3">
            {commandes.map((c) => (
              <li key={c.id} className="carte p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{c.numero}</p>
                      <BadgeStatut statut={c.statut} />
                    </div>
                    <p className="mt-1 text-[11px] text-bwaka-950/45">
                      {dateCourte(c.created_at)} · {c.items.length} article
                      {c.items.length > 1 ? "s" : ""} · {OPERATEURS[c.mode_paiement].court}
                    </p>
                  </div>
                  <p className="text-base font-bold tabular-nums">{fc(c.total)}</p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg bg-sable-50 pr-2">
                      <VignetteProduit image={item.image} nom={item.nom} className="h-10 w-10 rounded-l-lg" />
                      <span className="max-w-[140px] truncate text-[11px] text-bwaka-950/60">{item.nom}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-bwaka-900/8 pt-3">
                  <p className="text-[11px] text-bwaka-950/45">
                    Livraison : {c.adresse.quartier}, {c.adresse.ville}
                  </p>
                  <div className="flex gap-2">
                    {c.statut === "expediee" && (
                      <span className="badge bg-indigo-50 text-indigo-700">🛵 En route</span>
                    )}
                    <Link href={`/commande/${c.id}`} className="btn-contour btn-sm">
                      Suivre la commande
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
