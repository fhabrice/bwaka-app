import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { FormulaireAvis, FormulaireLitige } from "@/components/formulaires";
import { ConfirmerReception } from "@/components/suivi-actions";
import { BadgeStatut, EtapesSuivi, VignetteProduit } from "@/components/ui";
import { boutiqueDuVendeur, getCommande } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";
import {
  STATUTS_LIVRAISON,
  STATUTS_SEQUESTRE,
  dateHeure,
  fc,
  OPERATEURS,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function PageCommande({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await utilisateurCourant();
  if (!user) redirect(`/connexion?suite=/commande/${id}`);

  const commande = await getCommande(id);
  if (!commande) notFound();

  const estAcheteur = commande.buyer_id === user.id;
  const boutique = await boutiqueDuVendeur(user.id);
  const estVendeur = boutique ? commande.items.some((i) => i.store_id === boutique.id) : false;
  if (!estAcheteur && user.role !== "admin" && !estVendeur) {
    redirect("/compte");
  }

  const sequestre = STATUTS_SEQUESTRE[commande.sequestre];
  const paiement = OPERATEURS[commande.mode_paiement];

  return (
    <div className="conteneur py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-bwaka-950/45">
        <Link href="/compte" className="hover:text-bwaka-900">Mes commandes</Link>
        <span aria-hidden>/</span>
        <span className="text-bwaka-950/70">{commande.numero}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="surtitre">Commande {commande.numero}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Suivi de livraison</h1>
          <p className="mt-1 text-xs text-bwaka-950/50">Passée le {dateHeure(commande.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <BadgeStatut statut={commande.statut} />
          <span className={`badge ${sequestre.classe}`}>🔒 {sequestre.label}</span>
        </div>
      </header>

      <div className="carte mt-7 p-6">
        <EtapesSuivi statut={commande.statut} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <section className="carte overflow-hidden">
            <h2 className="border-b border-bwaka-900/8 px-5 py-4 text-sm font-bold">
              Articles ({commande.items.length})
            </h2>
            <ul className="divide-y divide-bwaka-900/8">
              {commande.items.map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <VignetteProduit
                    image={item.image}
                    nom={item.nom}
                    className="h-16 w-16 shrink-0 rounded-lg"
                  />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold">{item.nom}</p>
                      <p className="mt-1 text-[11px] text-bwaka-950/45">
                        {fc(item.prix)} × {item.quantite}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      {fc(item.prix * item.quantite)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {estAcheteur && commande.statut !== "livree" && commande.statut !== "annulee" && (
            <ConfirmerReception orderId={commande.id} code={commande.code_livraison} />
          )}

          {estAcheteur && commande.statut === "livree" && (
            <section className="carte p-5">
              <h2 className="text-sm font-bold">Votre avis compte</h2>
              <p className="mt-1 mb-3 text-xs text-bwaka-950/50">
                Les avis sont authentifiés : seuls les acheteurs livrés peuvent noter.
              </p>
              <div className="space-y-3">
                {commande.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-bwaka-900/8 pt-3 first:border-0 first:pt-0">
                    <span className="text-xs font-medium">{item.nom}</span>
                    <FormulaireAvis
                      productId={item.product_id}
                      storeId={item.store_id}
                      orderId={commande.id}
                      connecte
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {estAcheteur && (
            <section className="carte p-5">
              <h2 className="text-sm font-bold">Un problème avec cette commande ?</h2>
              <p className="mt-1 mb-3 text-xs leading-relaxed text-bwaka-950/50">
                Tant que vous n’avez pas confirmé la réception, l’argent reste bloqué en séquestre.
                Ouvrez un litige et BWAKA instruit le dossier sous 48 h.
              </p>
              <FormulaireLitige orderId={commande.id} />
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="carte p-5">
            <h2 className="text-sm font-bold">Récapitulatif</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-bwaka-950/60">
                <dt>Sous-total</dt>
                <dd className="tabular-nums">{fc(commande.sous_total)}</dd>
              </div>
              <div className="flex justify-between text-bwaka-950/60">
                <dt>Livraison ({commande.adresse.quartier})</dt>
                <dd className="tabular-nums">{fc(commande.frais_livraison)}</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-bwaka-900/12 pt-2 text-base font-bold">
                <dt>Total payé</dt>
                <dd className="tabular-nums">{fc(commande.total)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-sable-100 px-3 py-2 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ background: paiement.couleur }} />
              {paiement.nom}
            </div>
          </section>

          <section className="carte p-5">
            <h2 className="text-sm font-bold">Livraison</h2>
            <p className="mt-2 text-xs leading-relaxed text-bwaka-950/60">
              {commande.adresse.nom}
              <br />
              {commande.adresse.telephone}
              <br />
              {commande.adresse.quartier}, {commande.adresse.ville}
              {commande.adresse.indication ? (
                <>
                  <br />
                  <span className="text-bwaka-950/40">{commande.adresse.indication}</span>
                </>
              ) : null}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-bwaka-900/8 pt-3 text-[11px]">
              <span className="text-bwaka-950/50">Code de réception</span>
              <span className="rounded bg-bwaka-900 px-2 py-1 font-mono font-bold tracking-[0.2em] text-white">
                {commande.code_livraison}
              </span>
            </div>
          </section>

          <section className="carte p-5">
            <h2 className="text-sm font-bold">Séquestre BWAKA</h2>
            <p className={`badge mt-2 ${sequestre.classe}`}>{sequestre.label}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-bwaka-950/50">
              Montant conservé : <strong className="text-bwaka-900">{fc(commande.total)}</strong>.
              Commission BWAKA retenue sur la vente : {fc(commande.commission)}.
            </p>
            <p className="mt-2 text-[10px] text-bwaka-950/35">
              Statut livraison :{" "}
              {
                STATUTS_LIVRAISON[
                  commande.statut === "livree"
                    ? "livree"
                    : commande.statut === "expediee"
                      ? "en_route"
                      : commande.statut === "annulee"
                        ? "echouee"
                        : "a_attribuer"
                ].label
              }
            </p>
          </section>

          <Link href="/produits" className="btn-contour w-full">
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}
