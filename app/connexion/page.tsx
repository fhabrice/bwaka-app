import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormulaireConnexion } from "@/components/form-auth";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = { title: "Se connecter" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  const user = await utilisateurCourant();
  if (user) redirect(suite || "/compte");

  return (
    <div className="conteneur flex min-h-[75vh] items-center py-12">
      <div className="grid w-full items-center gap-12 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p className="surtitre">Bon retour sur BWAKA</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Reprenez vos commandes,<br />vos ventes et vos missions.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-bwaka-950/55">
            Un seul compte pour acheter, vendre et livrer. Vos commandes restent protégées par le
            séquestre BWAKA jusqu’à la réception.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-bwaka-950/60">
            {[
              "Paiement mobile money sécurisé",
              "Suivi de livraison en temps réel",
              "Boutique et statistiques en un clic",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="carte mx-auto w-full max-w-md p-7">
          <h2 className="text-xl font-bold tracking-tight">Se connecter</h2>
          <p className="mt-1 mb-5 text-xs text-bwaka-950/50">
            Entrez vos identifiants pour accéder à votre espace.
          </p>
          <FormulaireConnexion suite={suite} />
        </div>
      </div>
    </div>
  );
}
