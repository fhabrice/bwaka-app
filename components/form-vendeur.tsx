"use client";

import { useActionState, useState } from "react";

import { creerBoutique, enregistrerProduit, type EtatAction } from "@/app/actions";
import { CATEGORIES } from "@/lib/demo-data";
import { QUARTIERS, VILLES, fc } from "@/lib/utils";
import type { Produit } from "@/lib/types";

const INITIAL: EtatAction = {};

function Alerte({ etat }: { etat: EtatAction }) {
  if (etat.erreur)
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
        {etat.erreur}
      </p>
    );
  if (etat.ok)
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700" role="status">
        {etat.message ?? "Enregistré."}
      </p>
    );
  return null;
}

export function FormulaireBoutique({ villeDefaut }: { villeDefaut: string }) {
  const [etat, action, pending] = useActionState(creerBoutique, INITIAL);
  const [ville, setVille] = useState(villeDefaut || "Goma");

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="nom-boutique" className="etiquette">Nom de la boutique</label>
        <input
          id="nom-boutique"
          name="nom"
          required
          className="champ"
          placeholder="Ex. Volcan Tech"
        />
      </div>
      <div>
        <label htmlFor="description-boutique" className="etiquette">Description</label>
        <textarea
          id="description-boutique"
          name="description"
          rows={3}
          required
          className="champ"
          placeholder="Ce que vous vendez, vos garanties, vos délais…"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ville-boutique" className="etiquette">Ville</label>
          <select
            id="ville-boutique"
            name="ville"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="champ"
          >
            {VILLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quartier-boutique" className="etiquette">Quartier</label>
          <select id="quartier-boutique" name="quartier" className="champ">
            {(QUARTIERS[ville] ?? []).map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>
      <Alerte etat={etat} />
      <button type="submit" disabled={pending} className="btn-primaire w-full">
        {pending ? "Création…" : "Ouvrir ma boutique"}
      </button>
    </form>
  );
}

export function FormulaireProduit({ produit, villeDefaut }: { produit?: Produit; villeDefaut: string }) {
  const [etat, action, pending] = useActionState(enregistrerProduit, INITIAL);

  return (
    <form action={action} className="space-y-4">
      {produit && <input type="hidden" name="id" value={produit.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nom-produit" className="etiquette">Nom du produit</label>
          <input
            id="nom-produit"
            name="nom"
            required
            defaultValue={produit?.nom}
            className="champ"
            placeholder="Ex. Smartphone Tecno Spark 20"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description-produit" className="etiquette">Description</label>
          <textarea
            id="description-produit"
            name="description"
            rows={3}
            required
            defaultValue={produit?.description}
            className="champ"
            placeholder="Caractéristiques, garantie, contenu du colis…"
          />
        </div>
        <div>
          <label htmlFor="categorie-produit" className="etiquette">Catégorie</label>
          <select
            id="categorie-produit"
            name="categorie"
            defaultValue={produit?.categorie_slug ?? "electronique"}
            className="champ"
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.icone} {c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ville-produit" className="etiquette">Ville d’expédition</label>
          <select
            id="ville-produit"
            name="ville"
            defaultValue={produit?.ville ?? villeDefaut}
            className="champ"
          >
            {VILLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prix-produit" className="etiquette">Prix (FC)</label>
          <input
            id="prix-produit"
            name="prix"
            type="number"
            min={1}
            step={100}
            required
            defaultValue={produit?.prix}
            className="champ"
            placeholder="35000"
          />
          <p className="mt-1 text-[10px] text-bwaka-950/40">Montants en francs congolais.</p>
        </div>
        <div>
          <label htmlFor="stock-produit" className="etiquette">Stock disponible</label>
          <input
            id="stock-produit"
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={produit?.stock ?? 10}
            className="champ"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="image-produit" className="etiquette">Image (URL ou chemin)</label>
          <input
            id="image-produit"
            name="image"
            defaultValue={produit?.image ?? ""}
            className="champ"
            placeholder="/images/telephone.jpg ou https://…"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["telephone", "solaire", "ordinateur", "robe", "baskets", "cafe"].map((img) => (
              <button
                key={img}
                type="button"
                onClick={() => {
                  const champ = document.getElementById("image-produit") as HTMLInputElement | null;
                  if (champ) champ.value = `/images/${img}.jpg`;
                }}
                className="rounded-full bg-white px-2.5 py-1 text-[10px] text-bwaka-950/60 ring-1 ring-bwaka-900/10 hover:ring-bwaka-900/30"
              >
                {img}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-medium">
        <input type="checkbox" name="enAvant" defaultChecked={produit?.en_avant} className="h-4 w-4" />
        Mettre en avant sur la page d’accueil
      </label>

      <Alerte etat={etat} />
      <button type="submit" disabled={pending} className="btn-primaire w-full">
        {pending ? "Enregistrement…" : produit ? "Enregistrer les modifications" : "Publier le produit"}
      </button>
      {produit && (
        <p className="text-center text-[11px] text-bwaka-950/40">
          Prix actuel : {fc(produit.prix)} · stock {produit.stock}
        </p>
      )}
    </form>
  );
}

export function BasculeFormulaire({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOuvert((v) => !v)} className="btn-primaire btn-sm">
        {ouvert ? "Fermer" : titre}
      </button>
      {ouvert && <div className="mt-4 rounded-2xl border border-bwaka-900/10 bg-white p-5">{children}</div>}
    </div>
  );
}
