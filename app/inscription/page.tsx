import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormulaireInscription } from "@/components/form-auth";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = { title: "Créer un compte" };

const ARGUMENTS = [
  { titre: "Acheteur", texte: "Argent bloqué jusqu’à réception, livraison suivie, avis vérifiés." },
  { titre: "Vendeur", texte: "Boutique en 10 minutes, encaissement mobile money, 4 % de commission." },
  { titre: "Livreur", texte: "Missions proposées, tarif garanti, revenus suivis chaque semaine." },
];

export default async function PageInscription({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; suite?: string }>;
}) {
  const { role, suite } = await searchParams;
  const user = await utilisateurCourant();
  if (user) redirect("/compte");

  const roleInitial = ["vendeur", "livreur"].includes(role ?? "") ? role! : "acheteur";

  return (
    <div className="conteneur grid items-start gap-12 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="lg:sticky lg:top-28">
        <p className="surtitre">Inscription gratuite</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Un compte, trois métiers.
          <br />
          <span className="text-bwaka-700">Zéro frais d’entrée.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-bwaka-950/55">
          BWAKA est ouvert à toute personne qui veut acheter, vendre ou livrer en RDC. Inscrivez-vous
          en deux minutes depuis votre téléphone.
        </p>
        <div className="mt-8 space-y-3">
          {ARGUMENTS.map((a) => (
            <div key={a.titre} className="carte p-4">
              <p className="text-xs font-bold text-bwaka-900">{a.titre}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-bwaka-950/50">{a.texte}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="carte p-7">
        <h2 className="text-xl font-bold tracking-tight">Créer mon compte</h2>
        <p className="mt-1 mb-5 text-xs text-bwaka-950/50">Tous les champs sont obligatoires.</p>
        <FormulaireInscription roleInitial={roleInitial} suite={suite} />
      </div>
    </div>
  );
}
