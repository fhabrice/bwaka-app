'use strict';

/* ============ État global ============ */
const Etat = {
  token: localStorage.getItem('bwaka_token') || null,
  utilisateur: JSON.parse(localStorage.getItem('bwaka_utilisateur') || 'null'),
  panier: JSON.parse(localStorage.getItem('bwaka_panier') || '[]'),
  referentiels: { categories: [], methodesPaiement: [], villes: [] },
};

function sauverSession() {
  if (Etat.token) {
    localStorage.setItem('bwaka_token', Etat.token);
    localStorage.setItem('bwaka_utilisateur', JSON.stringify(Etat.utilisateur));
  } else {
    localStorage.removeItem('bwaka_token');
    localStorage.removeItem('bwaka_utilisateur');
  }
}

function sauverPanier() {
  localStorage.setItem('bwaka_panier', JSON.stringify(Etat.panier));
  majBadgePanier();
}

/* ============ API ============ */
async function api(chemin, options = {}) {
  const entetes = { ...(options.entetes || {}) };
  if (options.corps && !(options.corps instanceof FormData)) {
    entetes['Content-Type'] = 'application/json';
    options = { ...options, corps: JSON.stringify(options.corps) };
  }
  if (Etat.token) entetes['Authorization'] = `Bearer ${Etat.token}`;

  const reponse = await fetch(chemin, { ...options, headers: entetes });
  let donnees = null;
  try {
    donnees = await reponse.json();
  } catch {
    /* corps vide */
  }
  if (!reponse.ok) {
    const erreur = new Error((donnees && donnees.erreur) || `Erreur ${reponse.status}`);
    erreur.status = reponse.status;
    throw erreur;
  }
  return donnees;
}

/* ============ Formatage ============ */
function fc(montant) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FC';
}

function dateCourte(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function dateHeure(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function initiales(nom) {
  return String(nom || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0] || '')
    .join('')
    .toUpperCase();
}

function e(chaine) {
  return String(chaine ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LIBELLES_STATUT = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

function badgeStatut(statut) {
  return `<span class="badge-statut statut-${e(statut)}">${e(LIBELLES_STATUT[statut] || statut)}</span>`;
}

/* ============ Panier ============ */
function nbArticlesPanier() {
  return Etat.panier.reduce((s, l) => s + l.quantite, 0);
}

function totalPanier() {
  return Etat.panier.reduce((s, l) => s + l.prix * l.quantite, 0);
}

function ajouterAuPanier(produit, quantite = 1) {
  const ligne = Etat.panier.find((l) => l.produitId === produit.id);
  if (ligne) {
    ligne.quantite += quantite;
  } else {
    Etat.panier.push({
      produitId: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      image: produit.image,
      vendeurId: produit.vendeurId,
      ville: produit.ville,
      quantite,
      stock: produit.quantite,
    });
  }
  sauverPanier();
  toast(`« ${produit.nom} » ajouté au panier`, 'succes');
}

function majBadgePanier() {
  const badge = document.getElementById('badge-panier');
  if (!badge) return;
  const n = nbArticlesPanier();
  badge.textContent = n;
  badge.hidden = n === 0;
}

/* ============ Toasts ============ */
function toast(message, type = 'info') {
  const zone = document.getElementById('toast-zone');
  if (!zone) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  zone.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s ease';
    setTimeout(() => el.remove(), 320);
  }, 3400);
}

/* ============ Utilitaires vue ============ */
function imageOuPlaceholder(produit, classePlaceholder = 'carte-image-placeholder') {
  if (produit.image) {
    return `<img src="${e(produit.image)}" alt="${e(produit.nom)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'${classePlaceholder}\\'>${e(initiales(produit.categorie))}</div>'" />`;
  }
  return `<div class="${classePlaceholder}">${e(initiales(produit.categorie))}</div>`;
}

function carteProduitHtml(p) {
  const enRupture = p.quantite <= 0;
  return `
    <article class="carte-produit">
      <a class="carte-image" href="#/produit/${e(p.id)}">
        ${imageOuPlaceholder(p)}
        ${enRupture ? '<span class="etiquette" style="background:#d22b2b;color:#fff">Rupture</span>' : ''}
      </a>
      <div class="carte-corps">
        <span class="carte-categorie">${e(p.categorie)}</span>
        <a class="carte-titre" href="#/produit/${e(p.id)}">${e(p.nom)}</a>
        <div class="carte-prix">${fc(p.prix)}</div>
        <div class="carte-meta">
          <span>${e(p.ville)}</span>
          <span>${e(p.vendeur ? p.vendeur.nom : '')}</span>
        </div>
        <div class="carte-actions">
          <a class="btn btn-ghost btn-petit" href="#/produit/${e(p.id)}">Détails</a>
          <button class="btn btn-primaire btn-petit" data-ajouter-panier="${e(p.id)}" ${enRupture ? 'disabled' : ''}>Ajouter</button>
        </div>
      </div>
    </article>`;
}
