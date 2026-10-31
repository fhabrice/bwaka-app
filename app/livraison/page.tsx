import Link from "next/link";
import type { Metadata } from "next";

import { OPERATEURS, QUARTIERS, VILLES, ZONES_LIVRAISON, fc } from "@/lib/utils";

export const metadata: Metadata = { title: "Livraison — zones et tarifs" };

export default function PageLivraison() {
  return (
    <div className="conteneur py-12">
      <header className="max-w-2xl">
        <p className="surtitre">Le dernier kilomètre</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          La livraison n’est pas un module, c’est le produit.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bwaka-950/60">
          Sans dernier kilomètre fiable, aucune promesse de e-commerce ne tient. BWAKA affiche le
          tarif avant la commande, assigne un livreur identifié et suit le colis jusqu’à la preuve
          de livraison (code à 6 chiffres ou photo).
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {ZONES_LIVRAISON.map((zone) => (
          <div key={zone.zone} className="carte p-6">
            <p className="text-[11px] font-bold tracking-wide text-bwaka-700 uppercase">{zone.zone}</p>
            <p className="mt-2 text-2xl font-black tracking-tight tabular-nums">{fc(zone.frais)}</p>
            <p className="mt-1 text-xs text-bwaka-950/50">Délai estimé : {zone.delai}</p>
            <p className="mt-4 text-[11px] leading-relaxed text-bwaka-950/40">
              Bénéficiez du prix interurbain pour les envois entre {zone.villes.slice(0, 3).join(", ")}…
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="carte p-6">
          <h2 className="text-lg font-bold">Quartiers desservis</h2>
          <div className="mt-4 space-y-4">
            {VILLES.map((ville) => (
              <div key={ville}>
                <p className="text-xs font-bold text-bwaka-900">{ville}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(QUARTIERS[ville] ?? []).map((q) => (
                    <span key={q} className="rounded-full bg-sable-100 px-2.5 py-1 text-[11px] text-bwaka-950/60">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="carte p-6">
            <h2 className="text-lg font-bold">Comment ça marche</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Commande", "Le tarif de livraison est calculé selon votre quartier, avant validation."],
                ["Attribution", "Un livreur BWAKA proche de la boutique reçoit la mission."],
                ["En route", "Vous suivez le statut, le livreur vous appelle à l’arrivée."],
                ["Preuve", "Vous confirmez avec le code à 6 chiffres affiché sur votre commande."],
                ["Versement", "Le séquestre est libéré au vendeur et le livreur est crédité."],
              ].map(([titre, texte], i) => (
                <li key={titre} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bwaka-900 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{titre}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-bwaka-950/50">{texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="carte p-6">
            <h2 className="text-sm font-bold">Prière de vérifier votre numéro</h2>
            <p className="mt-2 text-xs leading-relaxed text-bwaka-950/55">
              Le numéro mobile money utilisé pour le paiement doit être joignable : le livreur s’en
              sert pour vous localiser. Le paiement à la livraison reste disponible dans toutes les
              villes couvertes.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(OPERATEURS).map(([cle, op]) => (
                <span key={cle} className="inline-flex items-center gap-1.5 rounded-full bg-sable-100 px-2.5 py-1 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: op.couleur }} />
                  {op.court}
                </span>
              ))}
            </div>
            <Link href="/livreur" className="btn-contour btn-sm mt-4">
              Devenir livreur BWAKA
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
