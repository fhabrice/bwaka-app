import Link from "next/link";
import { OPERATEURS, VILLES } from "@/lib/utils";
import { Logo } from "./header";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-bwaka-900/10 bg-bwaka-950 text-white/70">
      <div className="conteneur grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo sombre />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
            L’infrastructure de confiance du commerce congolais : le vendeur publie, l’acheteur
            paie, le livreur achemine — et l’argent ne se libère qu’une fois le produit reçu.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {VILLES.slice(0, 3).map((v) => (
              <span key={v} className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/70">
                {v}
              </span>
            ))}
            <span className="rounded-full bg-gold-400/15 px-2.5 py-1 text-[11px] font-medium text-gold-400">
              + 3 autres villes
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-[11px] font-bold tracking-[0.18em] text-white/40 uppercase">Acheter</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/produits" className="hover:text-gold-400">Catalogue complet</Link></li>
            <li><Link href="/boutiques" className="hover:text-gold-400">Boutiques vérifiées</Link></li>
            <li><Link href="/panier" className="hover:text-gold-400">Mon panier</Link></li>
            <li><Link href="/compte" className="hover:text-gold-400">Suivre mes commandes</Link></li>
            <li><Link href="/livraison" className="hover:text-gold-400">Zones et tarifs de livraison</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-bold tracking-[0.18em] text-white/40 uppercase">Vendre & livrer</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/vendre" className="hover:text-gold-400">Ouvrir ma boutique</Link></li>
            <li><Link href="/vendeur" className="hover:text-gold-400">Tableau de bord vendeur</Link></li>
            <li><Link href="/livreur" className="hover:text-gold-400">Devenir livreur BWAKA</Link></li>
            <li><Link href="/admin" className="hover:text-gold-400">Back-office</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-bold tracking-[0.18em] text-white/40 uppercase">Paiement mobile money</h3>
          <ul className="mt-4 space-y-2">
            {Object.entries(OPERATEURS).map(([cle, op]) => (
              <li key={cle} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: op.couleur }} />
                {op.nom}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="conteneur flex flex-col gap-3 py-6 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BWAKA · Goma, Nord-Kivu, RD Congo. Tous droits réservés.</p>
          <p>
            Conçu et développé par{" "}
            <a href="https://www.linksmartec.com" className="text-white/60 hover:text-gold-400">
              LK-TECH / LinkSmartec Sarl
            </a>{" "}
            · RCCM CD-GOM-01-2024-A-002698
          </p>
        </div>
      </div>
    </footer>
  );
}
