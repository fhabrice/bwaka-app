'use strict';

/* ============ Routeur & initialisation ============ */

function majZoneCompte() {
  const zone = document.getElementById('zone-compte');
  if (!zone) return;
  if (Etat.utilisateur) {
    zone.innerHTML = `
      <div class="menu-compte">
        <button class="menu-compte-btn" id="btn-menu-compte" aria-expanded="false">
          <span class="avatar">${e(initiales(Etat.utilisateur.nom))}</span>
          <span>${e(Etat.utilisateur.nom.split(' ')[0])}</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="menu-compte-liste" id="menu-compte-liste" hidden>
          <a href="#/ventes">📊 Tableau de bord vendeur</a>
          <a href="#/mes-produits">📦 Mes produits</a>
          <a href="#/mes-commandes">🧾 Mes commandes</a>
          <a href="#/vendre">💰 Vendre un produit</a>
          <div class="separateur"></div>
          <button class="danger" id="btn-deconnexion">🚪 Se déconnecter</button>
        </div>
      </div>`;
    const btn = document.getElementById('btn-menu-compte');
    const liste = document.getElementById('menu-compte-liste');
    btn?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      liste.hidden = !liste.hidden;
      btn.setAttribute('aria-expanded', String(!liste.hidden));
    });
    document.getElementById('btn-deconnexion')?.addEventListener('click', () => {
      Etat.token = null;
      Etat.utilisateur = null;
      sauverSession();
      majZoneCompte();
      toast('Vous êtes déconnecté. À bientôt !');
      location.hash = '#/';
    });
  } else {
    zone.innerHTML = `
      <a class="nav-lien" href="#/connexion">Connexion</a>
      <a class="btn btn-primaire" href="#/inscription">S'inscrire</a>`;
  }
}

function majBarreCategories() {
  const barre = document.getElementById('barre-categories');
  if (!barre) return;
  const active = new URLSearchParams((location.hash.split('?')[1] || '')).get('categorie') || '';
  barre.innerHTML = `<div class="conteneur">
    ${Etat.referentiels.categories
      .map(
        (c) =>
          `<a class="puce-categorie ${c === active ? 'actif' : ''}" href="#/?categorie=${encodeURIComponent(c)}">${e(c)}</a>`
      )
      .join('')}
  </div>`;
}

function pageCourante() {
  const hash = location.hash || '#/';
  const chemin = (hash.split('?')[0] || '#/').replace(/^#/, '') || '/';
  const params = new URLSearchParams(hash.split('?')[1] || '');
  return { chemin, params };
}

async function router() {
  const { chemin, params } = pageCourante();
  const app = document.getElementById('app');
  if (!app) return;

  const [base, arg] = chemin.split('/').filter(Boolean);
  let vue = null;

  if (!base) vue = Vues.accueil;
  else if (base === 'produit' && arg) vue = Vues.produit;
  else if (base === 'panier') vue = Vues.panier;
  else if (base === 'commande') vue = Vues.commande;
  else if (base === 'confirmation' && arg) vue = Vues.confirmation;
  else if (base === 'connexion') vue = Vues.connexion;
  else if (base === 'inscription') vue = Vues.inscription;
  else if (base === 'vendre') vue = Vues.vendre;
  else if (base === 'mes-produits') vue = Vues.mesProduits;
  else if (base === 'mes-commandes') vue = Vues.mesCommandes;
  else if (base === 'ventes') vue = Vues.mesVentes;

  if (!vue) {
    app.innerHTML = `<div class="page-vide" style="margin-top:40px"><div class="grand">🧭</div><h3>Page introuvable</h3><p>La page demandée n'existe pas.</p><a class="btn btn-primaire" href="#/">Retour à l'accueil</a></div>`;
    return;
  }

  app.innerHTML = `<div class="page-vide" style="margin:30px 0;border:none;background:transparent"><p style="color:var(--texte-doux)">Chargement…</p></div>`;
  try {
    app.innerHTML = await vue.rendre(params, chemin);
    if (vue.apres) vue.apres(params, chemin);
  } catch (err) {
    if (err.status === 401) {
      Etat.token = null;
      Etat.utilisateur = null;
      sauverSession();
      majZoneCompte();
      location.hash = '#/connexion';
      return;
    }
    app.innerHTML = `<div class="page-vide" style="margin-top:40px"><div class="grand">⚠️</div><h3>Une erreur est survenue</h3><p>${e(err.message)}</p><a class="btn btn-primaire" href="#/">Retour à l'accueil</a></div>`;
  }

  majBarreCategories();
  window.scrollTo(0, 0);
}

/* ============ Actions globales (délégation) ============ */
document.addEventListener('click', async (ev) => {
  // Fermer le menu compte au clic extérieur
  const liste = document.getElementById('menu-compte-liste');
  if (liste && !liste.hidden && !ev.target.closest('.menu-compte')) liste.hidden = true;

  const cible = ev.target.closest('[data-ajouter-panier],[data-acheter-maintenant],[data-panier-plus],[data-panier-moins],[data-panier-retirer],[data-supprimer-produit],[data-statut]');
  if (!cible) return;

  // Ajouter au panier
  const idAjout = cible.getAttribute('data-ajouter-panier');
  const idAchat = cible.getAttribute('data-acheter-maintenant');
  if (idAjout || idAchat) {
    const id = idAjout || idAchat;
    try {
      const { produit } = await api(`/api/produits/${id}`);
      ajouterAuPanier(produit);
      if (idAchat) location.hash = '#/commande';
    } catch (err) {
      toast(err.message, 'erreur');
    }
    return;
  }

  // Quantités panier
  const plus = cible.getAttribute('data-panier-plus');
  const moins = cible.getAttribute('data-panier-moins');
  const retirer = cible.getAttribute('data-panier-retirer');
  if (plus || moins || retirer) {
    const id = plus || moins || retirer;
    const ligne = Etat.panier.find((l) => l.produitId === id);
    if (ligne) {
      if (plus) ligne.quantite += 1;
      if (moins) ligne.quantite = Math.max(1, ligne.quantite - 1);
      if (retirer) Etat.panier = Etat.panier.filter((l) => l.produitId !== id);
      sauverPanier();
      router();
    }
    return;
  }

  // Supprimer un produit
  const idSuppr = cible.getAttribute('data-supprimer-produit');
  if (idSuppr) {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      await api(`/api/produits/${idSuppr}`, { method: 'DELETE' });
      toast('Produit supprimé', 'succes');
      router();
    } catch (err) {
      toast(err.message, 'erreur');
    }
    return;
  }

  // Changer le statut d'une commande
  const statut = cible.getAttribute('data-statut');
  if (statut) {
    const [id, nouveau] = statut.split('|');
    const libelle = LIBELLES_STATUT[nouveau] || nouveau;
    if (nouveau === 'annulee' && !confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    try {
      await api(`/api/commandes/${id}/statut`, { method: 'PATCH', corps: { statut: nouveau } });
      toast(`Commande mise à jour : ${libelle}`, 'succes');
      router();
    } catch (err) {
      toast(err.message, 'erreur');
    }
    return;
  }
});

/* Recherche dans l'en-tête */
document.getElementById('form-recherche-entete')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const q = document.getElementById('champ-recherche-entete').value.trim();
  const nouveau = q ? `#/?q=${encodeURIComponent(q)}` : '#/';
  if (location.hash === nouveau) router();
  else location.hash = nouveau;
});

/* Menu burger mobile */
document.getElementById('btn-burger')?.addEventListener('click', () => {
  const nav = document.getElementById('nav-entete');
  const btn = document.getElementById('btn-burger');
  const ouvert = nav.classList.toggle('ouvert');
  btn.setAttribute('aria-expanded', String(ouvert));
});

/* ============ Démarrage ============ */
(async function init() {
  try {
    Etat.referentiels = await api('/api/referentiels');
    if (Etat.token) {
      const { utilisateur } = await api('/api/auth/moi');
      Etat.utilisateur = utilisateur;
      sauverSession();
    }
  } catch {
    Etat.token = null;
    Etat.utilisateur = null;
    sauverSession();
  }
  majZoneCompte();
  majBadgePanier();
  majBarreCategories();
  window.addEventListener('hashchange', router);
  router();
})();
