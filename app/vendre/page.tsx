import Link from "next/link";
import type { Metadata } from "next";

import { Stat } from "@/components/ui";
import { fc, COMMISSION_TAUX, TAUX_USD } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendre sur BWAKA" };

const ETAPES = [
  { n: "01", titre: "Créez votre compte", texte: "Nom, téléphone, ville. Deux minutes, gratuit, aucun document requis pour démarrer." },
  { n: "02", titre: "Ouvrez votre boutique", texte: "Nom, description, quartier. Votre vitrine est en ligne immédiatement." },
  { n: "03", titre: "Publiez vos produits", texte: "Photo, prix, stock. Vous pouvez modifier ou retirer un article à tout moment." },
  { n: "04", titre: "Encaissez", texte: "Le client paie en mobile money. L’argent est bloqué puis versé après réception." },
];

const FAQ = [
  ["Combien coûte BWAKA ?", "L’inscription et la publication sont gratuites. BWAKA retient 4 % de commission uniquement sur les commandes livrées. Aucun abonnement obligatoire."],
  ["Quand suis-je payé ?", "Dès que l’acheteur confirme la réception (code ou photo). Le versement part sur votre wallet mobile money, commission déduite."],
  ["Ai-je besoin d’un smartphone récent ?", "Non. L’interface est légère, les images sont compressées et le catalogue fonctionne partiellement hors ligne."],
  ["Que se passe-t-il en cas de litige ?", "Le montant reste en séquestre pendant l’instruction. BWAKA tranche sous 48 h : versement au vendeur ou remboursement de l’acheteur."],
  ["Puis-je vendre dans plusieurs villes ?", "Oui. Indiquez la ville de chaque produit ; les frais de livraison sont calculés par zone automatiquement."],
];

export default function PageVendre() {
  const exemple = 200000;
  return (
    <div>
      <section className="bg-bwaka-950 text-white">
        <div className="conteneur grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="surtitre !text-gold-400">Espace vendeur · ouvert à tous</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Votre boutique en ligne
              <br />
              en <span className="text-gold-400">10 minutes</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
              Vous vendez déjà par WhatsApp et Facebook ? BWAKA vous donne un catalogue, un stock,
              un historique client et un encaissement mobile money automatique — sans avance de
              frais.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/inscription?role=vendeur" className="btn-or">
                Créer ma boutique gratuitement
              </Link>
              <Link href="/connexion" className="btn border border-white/20 text-white hover:bg-white/10">
                J’ai déjà un compte
              </Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[11px]">
              {[
                ["0 $", "pour s’inscrire"],
                ["4 %", "de commission"],
                ["48 h", "délai de versement"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-black text-gold-400">{v}</p>
                  <p className="mt-1 text-white/50">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="carte !border-white/10 !bg-white/[0.04] p-6 backdrop-blur">
            <p className="text-[11px] font-bold tracking-wide text-white/40 uppercase">Simulation de revenus</p>
            <p className="mt-3 text-xs text-white/50">Pour 10 commandes de {fc(exemple)} dans le mois :</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-white/70">
                <dt>Chiffre d’affaires</dt>
                <dd className="font-semibold text-white tabular-nums">{fc(exemple * 10)}</dd>
              </div>
              <div className="flex justify-between text-white/70">
                <dt>Commission BWAKA (4 %)</dt>
                <dd className="tabular-nums text-rose-300">− {fc(exemple * 10 * COMMISSION_TAUX)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2.5 text-white">
                <dt className="font-semibold">Net pour vous</dt>
                <dd className="font-bold text-emerald-300 tabular-nums">
                  {fc(exemple * 10 * (1 - COMMISSION_TAUX))}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[10px] leading-relaxed text-white/35">
              Soit environ {(exemple * 10 * (1 - COMMISSION_TAUX) / TAUX_USD).toFixed(0)} $ au taux
              indicatif de {TAUX_USD} FC / USD. Les frais de livraison sont payés par l’acheteur.
            </p>
          </div>
        </div>
      </section>

      <section className="conteneur py-14">
        <h2 className="text-2xl font-bold tracking-tight">Quatre étapes, aucune compétence technique</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map((e) => (
            <div key={e.n} className="carte p-6">
              <span className="text-[11px] font-black tracking-widest text-gold-600">{e.n}</span>
              <h3 className="mt-3 text-sm font-bold">{e.titre}</h3>
              <p className="mt-2 text-xs leading-relaxed text-bwaka-950/55">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="conteneur pb-14">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat valeur="4 %" label="Commission unique sur les ventes livrées" detail="Aucun frais d’entrée, aucun abonnement obligatoire" accent />
          <Stat valeur="48 h" label="Versement après confirmation de réception" detail="Sur votre wallet mobile money" />
          <Stat valeur="6" label="Villes couvertes au lancement" detail="Goma, Bukavu, Kinshasa, Lubumbashi, Kisangani, Mbuji-Mayi" />
        </div>
      </section>

      <section className="conteneur pb-16">
        <h2 className="text-2xl font-bold tracking-tight">Questions fréquentes</h2>
        <div className="mt-6 divide-y divide-bwaka-900/10 overflow-hidden rounded-2xl border border-bwaka-900/10 bg-white">
          {FAQ.map(([q, r]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                {q}
                <span className="text-bwaka-950/30 transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2.5 max-w-3xl text-xs leading-relaxed text-bwaka-950/60">{r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="conteneur pb-20">
        <div className="carte flex flex-col items-center gap-4 bg-gold-100 px-6 py-12 text-center">
          <h2 className="text-2xl font-black tracking-tight">Prêt à vendre à Goma, Bukavu et Kinshasa ?</h2>
          <p className="max-w-xl text-sm text-bwaka-950/60">
            Ouvrez votre boutique maintenant. Votre premier produit peut être en ligne avant la fin
            de la journée.
          </p>
          <Link href="/inscription?role=vendeur" className="btn-primaire">
            Ouvrir ma boutique
          </Link>
        </div>
      </section>
    </div>
  );
}
