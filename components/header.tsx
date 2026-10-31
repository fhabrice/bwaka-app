"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { SessionUser } from "@/lib/types";
import { initiales } from "@/lib/utils";
import { usePanier } from "./panier-provider";

const LIENS = [
  { href: "/produits", label: "Explorer" },
  { href: "/boutiques", label: "Boutiques" },
  { href: "/livraison", label: "Livraison" },
  { href: "/vendre", label: "Vendre" },
];

export function Logo({ sombre = false }: { sombre?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="BWAKA — accueil">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bwaka-900 text-[13px] font-black tracking-tight text-gold-400 shadow-sm transition-transform duration-300 group-hover:-rotate-3">
        BW
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`text-[15px] font-black tracking-[0.18em] ${sombre ? "text-white" : "text-bwaka-950"}`}
        >
          BWAKA
        </span>
        <span className="mt-1 text-[9px] font-semibold tracking-[0.16em] text-bwaka-700/70 uppercase">
          RDC · Marketplace
        </span>
      </span>
    </Link>
  );
}

export function Header({
  user,
  demo,
  vendeur,
}: {
  user: SessionUser | null;
  demo: boolean;
  vendeur: boolean;
}) {
  const { nombre } = usePanier();
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [menuCompte, setMenuCompte] = useState(false);

  useEffect(() => {
    setOuvert(false);
    setMenuCompte(false);
  }, [pathname]);

  const espace =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "livreur"
        ? "/livreur"
        : vendeur
          ? "/vendeur"
          : "/compte";

  return (
    <>
      {demo && (
        <div className="bg-bwaka-950 text-center text-[11px] font-medium tracking-wide text-white/80">
          <span className="conteneur flex items-center justify-center gap-2 py-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400" />
            Mode démonstration — données de test. Connectez Supabase dans <code className="font-mono">.env.local</code> pour passer en production.
          </span>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-bwaka-900/8 bg-sable-50/85 backdrop-blur-xl">
        <div className="conteneur flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-7">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {LIENS.map((lien) => {
                const actif = pathname.startsWith(lien.href);
                return (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                      actif
                        ? "bg-bwaka-900/6 text-bwaka-950"
                        : "text-bwaka-950/65 hover:bg-bwaka-900/4 hover:text-bwaka-950"
                    }`}
                  >
                    {lien.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/panier"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-bwaka-900 transition-colors hover:bg-bwaka-900/6"
              aria-label={`Panier — ${nombre} article${nombre > 1 ? "s" : ""}`}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {nombre > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-bwaka-950">
                  {nombre}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuCompte((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-bwaka-900/12 bg-white py-1 pr-3 pl-1 text-sm font-semibold transition-colors hover:border-bwaka-900/25"
                  aria-expanded={menuCompte}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bwaka-900 text-[11px] font-bold text-white">
                    {initiales(user.nom)}
                  </span>
                  <span className="hidden max-w-[110px] truncate sm:block">{user.nom.split(" ")[0]}</span>
                </button>
                {menuCompte && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-bwaka-900/10 bg-white p-1.5 shadow-xl">
                    <p className="px-3 py-2 text-[11px] font-semibold tracking-wide text-bwaka-950/45 uppercase">
                      {user.role} · {user.ville}
                    </p>
                    <Link href={espace} className="block rounded-lg px-3 py-2 text-sm hover:bg-bwaka-50">
                      Mon espace
                    </Link>
                    <Link href="/compte" className="block rounded-lg px-3 py-2 text-sm hover:bg-bwaka-50">
                      Mes commandes
                    </Link>
                    <Link href="/vendeur" className="block rounded-lg px-3 py-2 text-sm hover:bg-bwaka-50">
                      Espace vendeur
                    </Link>
                    <Link href="/livreur" className="block rounded-lg px-3 py-2 text-sm hover:bg-bwaka-50">
                      Espace livreur
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-bwaka-50">
                        Back-office
                      </Link>
                    )}
                    <form action="/api/deconnexion" method="post">
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      >
                        Se déconnecter
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Link href="/connexion" className="btn-fantome btn-sm">
                  Se connecter
                </Link>
                <Link href="/inscription" className="btn-primaire btn-sm">
                  Créer un compte
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOuvert((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-bwaka-900 hover:bg-bwaka-900/6 md:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={ouvert}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {ouvert ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {ouvert && (
          <div className="border-t border-bwaka-900/8 bg-sable-50 px-4 pb-4 md:hidden">
            <nav className="flex flex-col py-2">
              {LIENS.map((lien) => (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium text-bwaka-950/80 hover:bg-white"
                >
                  {lien.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link href="/connexion" className="rounded-lg px-2 py-2.5 text-sm font-medium text-bwaka-950/80 hover:bg-white">
                    Se connecter
                  </Link>
                  <Link href="/inscription" className="btn-primaire btn-sm mt-2">
                    Créer un compte gratuit
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
