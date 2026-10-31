import Link from "next/link";
import type { ReactNode } from "react";
import type { Commande, StatutCommande } from "@/lib/types";
import { ETAPES_COMMANDE, STATUTS_COMMANDE, etapeIndex, fc, initiales } from "@/lib/utils";

export function Etoiles({ note, taille = "sm" }: { note: number; taille?: "sm" | "md" }) {
  const pleines = Math.round(note);
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${taille === "md" ? "text-base" : "text-xs"}`}
      aria-label={`Note ${note} sur 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < pleines ? "text-gold-500" : "text-bwaka-900/15"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Prix({ montant, taille = "md" }: { montant: number; taille?: "sm" | "md" | "lg" }) {
  const classes =
    taille === "lg"
      ? "text-2xl font-bold tracking-tight"
      : taille === "sm"
        ? "text-sm font-semibold"
        : "text-base font-bold tracking-tight";
  return (
    <span className={`${classes} text-bwaka-900 tabular-nums`}>
      {fc(montant)}
    </span>
  );
}

export function BadgeStatut({ statut }: { statut: StatutCommande }) {
  const s = STATUTS_COMMANDE[statut];
  return (
    <span className={`badge ${s.classe}`}>
      <span aria-hidden>{s.icone}</span>
      {s.label}
    </span>
  );
}

export function Avatar({ nom, taille = 36 }: { nom: string; taille?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-bwaka-900 font-semibold text-white"
      style={{ width: taille, height: taille, fontSize: taille * 0.36 }}
      aria-hidden
    >
      {initiales(nom)}
    </span>
  );
}

export function VignetteProduit({
  image,
  nom,
  className = "",
}: {
  image: string | null;
  nom: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-sable-100 ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={nom}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl opacity-30">🛍️</div>
      )}
    </div>
  );
}

export function EtapesSuivi({ statut }: { statut: StatutCommande }) {
  if (statut === "annulee") {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        Cette commande a été annulée. Le montant est remboursé sur le wallet utilisé.
      </div>
    );
  }
  const index = etapeIndex(statut);
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
      {ETAPES_COMMANDE.map((etape, i) => {
        const fait = i <= index;
        const courant = i === index;
        return (
          <li key={etape.statut} className="relative flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            {i < ETAPES_COMMANDE.length - 1 && (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-4px)] w-0.5 sm:top-[15px] sm:left-1/2 sm:h-0.5 sm:w-full ${
                  i < index ? "bg-bwaka-800" : "bg-bwaka-900/12"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ${
                fait
                  ? "bg-bwaka-900 text-white ring-white"
                  : "bg-bwaka-900/10 text-bwaka-900/40 ring-white"
              } ${courant ? "outline-2 outline-offset-2 outline-gold-400" : ""}`}
            >
              {fait ? "✓" : i + 1}
            </span>
            <span className={`text-xs font-semibold sm:mt-2 ${fait ? "text-bwaka-900" : "text-bwaka-900/40"}`}>
              {etape.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Stat({
  valeur,
  label,
  detail,
  accent = false,
}: {
  valeur: ReactNode;
  label: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "carte bg-bwaka-900 p-5 text-white" : "carte p-5"}>
      <p className={`text-2xl font-bold tracking-tight ${accent ? "text-gold-400" : "text-bwaka-900"}`}>
        {valeur}
      </p>
      <p className={`mt-1 text-xs font-medium ${accent ? "text-white/70" : "text-bwaka-950/55"}`}>
        {label}
      </p>
      {detail && (
        <p className={`mt-2 text-[11px] ${accent ? "text-white/50" : "text-bwaka-950/40"}`}>{detail}</p>
      )}
    </div>
  );
}

export function Vide({
  icone = "🗂️",
  titre,
  texte,
  action,
}: {
  icone?: string;
  titre: string;
  texte?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="carte flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden>
        {icone}
      </span>
      <h3 className="text-base font-semibold">{titre}</h3>
      {texte && <p className="max-w-sm text-sm text-bwaka-950/55">{texte}</p>}
      {action && (
        <Link href={action.href} className="btn-primaire btn-sm mt-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SectionTitre({
  surtitre,
  titre,
  texte,
  action,
}: {
  surtitre?: string;
  titre: string;
  texte?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {surtitre && <p className="surtitre mb-2">{surtitre}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-bwaka-950 sm:text-[28px]">{titre}</h2>
        {texte && <p className="mt-2 text-sm leading-relaxed text-bwaka-950/60">{texte}</p>}
      </div>
      {action && (
        <Link href={action.href} className="text-sm font-semibold text-bwaka-800 hover:text-bwaka-600">
          {action.label} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

export function RecapCommande({ commande }: { commande: Commande }) {
  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-bwaka-950/70">
        <span>Sous-total</span>
        <span className="tabular-nums">{fc(commande.sous_total)}</span>
      </div>
      <div className="flex justify-between text-bwaka-950/70">
        <span>Livraison</span>
        <span className="tabular-nums">{fc(commande.frais_livraison)}</span>
      </div>
      <div className="flex justify-between border-t border-dashed border-bwaka-900/12 pt-2.5 text-base font-bold">
        <span>Total</span>
        <span className="tabular-nums">{fc(commande.total)}</span>
      </div>
    </div>
  );
}
