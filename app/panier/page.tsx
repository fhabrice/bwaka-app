import type { Metadata } from "next";

import { PanierClient } from "@/components/panier-client";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = { title: "Mon panier" };

export default async function PagePanier() {
  const user = await utilisateurCourant();

  return (
    <div className="conteneur py-10">
      <header className="mb-8">
        <p className="surtitre">Commande</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Mon panier</h1>
        <p className="mt-2 text-sm text-bwaka-950/55">
          Un seul panier, plusieurs boutiques. Les frais de livraison sont calculés par zone avant
          validation.
        </p>
      </header>
      <PanierClient user={user} />
    </div>
  );
}
