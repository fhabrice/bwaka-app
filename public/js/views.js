'use strict';

/* ============ Vues de l'application ============ */
const Vues = {};

/* ---------- Accueil / Catalogue ---------- */
Vues.accueil = {
  async rendre(params) {
    const q = params.get('q') || '';
    const categorie = params.get('categorie') || '';
    const ville = params.get('ville') || '';
    const tri = params.get('tri') || '';

    const [cat, vil] = await Promise.all([
      api(`/api/produits?${new URLSearchParams({ q, categorie, ville, tri })}`),
      api('/api/referentiels'),
    ]);
    Etat.referentiels = vil;

    const produits = cat.produits;
    const heroVisible = !q && !categorie;

    return `
      ${heroVisible ? `
      <section class="hero">
        <img class="hero-image" src="/images/hero.jpg" alt="Marché en RDC" onerror="this.style.display='none'" />
        <div class="hero-contenu">
          <span class="hero-sur-titre">🛒 Marketplace 100 % congolaise</span>
          <h1>Vendez et achetez <span class="souligne">partout en RDC</span></h1>
          <p>Bwaka est ouvert à tous : créez votre compte membre et commencez à vendre vos produits en quelques minutes, partout en République Démocratique du Congo.</p>
          <div class="hero-actions">
            <a class="btn btn-jaune" href="#/inscription">Devenir membre vendeur</a>
            <a class="btn btn-ghost" href="#catalogue">Explorer le catalogue</a>
          </div>
          <div class="hero-stats">
            <div><strong>12+</strong><span>produits disponibles</span></div>
            <div><strong>16</strong><span>villes couvertes</span></div>
            <div><strong>4</strong><span>moyens de paiement mobile</span></div>
          </div>
        </div>
      </section>` : ''}

      <section class="section" id="catalogue">
        <div class="entete-section">
          <div>
            <h2>${q ? `Résultats pour « ${e(q)} »` : categorie ? e(categorie) : 'Produits à la une'}</h2>
            <p>${q || categorie || ville ? 'Affinez votre recherche avec les filtres ci-dessous' : 'Découvrez les derniers produits mis en vente par nos membres'}</p>
          </div>
          <a class="lien-voir" href="#/vendre">+ Vendre un produit</a>
        </div>

        <form class="filtres-barre" id="form-filtres">
          <select name="categorie" aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            ${Etat.referentiels.categories.map((c) => `<option value="${e(c)}" ${c === categorie ? 'selected' : ''}>${e(c)}</option>`).join('')}
          </select>
          <select name="ville" aria-label="Ville">
            <option value="">Toutes les villes</option>
            ${Etat.referentiels.villes.map((v) => `<option value="${e(v)}" ${v === ville ? 'selected' : ''}>${e(v)}</option>`).join('')}
          </select>
          <select name="tri" aria-label="Trier par">
            <option value="">Plus récents</option>
            <option value="prix_asc" ${tri === 'prix_asc' ? 'selected' : ''}>Prix croissant</option>
            <option value="prix_desc" ${tri === 'prix_desc' ? 'selected' : ''}>Prix décroissant</option>
          </select>
          <span class="resultat-compte">${produits.length} produit${produits.length > 1 ? 's' : ''}</span>
        </form>

        ${produits.length === 0
          ? `<div class="page-vide"><div class="grand">🔍</div><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou publiez le premier produit dans cette catégorie.</p><a class="btn btn-primaire" href="#/vendre">Vendre un produit</a></div>`
          : `<div class="grille-produits">${produits.map(carteProduitHtml).join('')}</div>`}
      </section>

      ${heroVisible ? `
      <section class="section">
        <div class="entete-section">
          <div>
            <h2>Parcourir par catégorie</h2>
            <p>Trouvez rapidement ce que vous cherchez</p>
          </div>
        </div>
        <div class="grille-categories">
          ${Etat.referentiels.categories.slice(0, 8).map((c, i) => `
            <a class="tuile-categorie" href="#/?categorie=${encodeURIComponent(c)}">
              <div class="icone">${e(initiales(c))}</div>
              ${e(c)}
              <span>${['Téléphones & accessoires', 'PC, TV & audio', 'Habits & chaussures', 'Solaire & maison', 'Produits frais', 'Soins & bien-être', 'Élevage & cultures', 'Terrains & locations'][i] || 'Voir les offres'}</span>
            </a>`).join('')}
        </div>
      </section>

      <section class="bandeau">
        <div class="item">
          <div class="rond">✓</div>
          <div><h4>Inscription gratuite</h4><p>Créez votre compte membre en 2 minutes et commencez à vendre immédiatement.</p></div>
        </div>
        <div class="item">
          <div class="rond">📱</div>
          <div><h4>Paiement mobile money</h4><p>M-Pesa, Orange Money, Airtel Money, Africell Money ou paiement à la livraison.</p></div>
        </div>
        <div class="item">
          <div class="rond">🚚</div>
          <div><h4>Livraison partout en RDC</h4><p>Goma, Bukavu, Kinshasa, Lubumbashi, Kisangani et bien d'autres villes.</p></div>
        </div>
        <div class="item">
          <div class="rond">🤝</div>
          <div><h4>Vendeurs vérifiés</h4><p>Chaque membre dispose d'un profil public et d'un historique de ventes transparent.</p></div>
        </div>
      </section>` : ''}
    `;
  },
  apres() {
    const form = document.getElementById('form-filtres');
    if (form) {
      form.addEventListener('change', () => {
        const fd = new FormData(form);
        const params = new URLSearchParams();
        for (const [k, v] of fd.entries()) if (v) params.set(k, v);
        const q = document.getElementById('champ-recherche-entete')?.value.trim();
        if (q) params.set('q', q);
        location.hash = `#/?${params.toString()}`;
      });
    }
  },
};

/* ---------- Détail produit ---------- */
Vues.produit = {
  async rendre(params, chemin) {
    const id = chemin.split('/')[2];
    const { produit: p } = await api(`/api/produits/${id}`);
    const memeVendeur = (await api(`/api/produits?vendeur=${p.vendeurId}`)).produits
      .filter((x) => x.id !== p.id)
      .slice(0, 4);

    return `
      <nav class="fil-ariane">
        <a href="#/">Accueil</a> <span>›</span>
        <a href="#/?categorie=${encodeURIComponent(p.categorie)}">${e(p.categorie)}</a> <span>›</span>
        <span>${e(p.nom)}</span>
      </nav>

      <div class="grille-detail">
        <div class="detail-image">${imageOuPlaceholder(p)}</div>
        <div class="detail-infos">
          <div class="detail-badges">
            <span class="pastille">${e(p.categorie)}</span>
            <span class="pastille">📍 ${e(p.ville)}</span>
            <span class="pastille">${p.quantite > 0 ? `${p.quantite} en stock` : 'Rupture de stock'}</span>
          </div>
          <h1>${e(p.nom)}</h1>
          <div class="detail-prix">${fc(p.prix)} <span class="devise">FC</span></div>

          <div class="carte-vendeur">
            <div class="avatar">${e(initiales(p.vendeur ? p.vendeur.nom : '?'))}</div>
            <div>
              <div class="nom">${e(p.vendeur ? p.vendeur.nom : 'Vendeur')}</div>
              <div class="detail">Membre depuis ${e(dateCourte(p.vendeur ? p.vendeur.membreDepuis : p.createdAt))} · ${e(p.ville)}</div>
            </div>
          </div>

          <p class="detail-description">${e(p.description)}</p>

          <div class="detail-actions">
            <button class="btn btn-primaire" data-ajouter-panier="${e(p.id)}" ${p.quantite <= 0 ? 'disabled' : ''}>🛒 Ajouter au panier</button>
            <button class="btn btn-jaune" data-acheter-maintenant="${e(p.id)}" ${p.quantite <= 0 ? 'disabled' : ''}>Acheter maintenant</button>
          </div>

          <div class="bandeau" style="margin:26px 0 0;grid-template-columns:1fr 1fr">
            <div class="item"><div class="rond">🔒</div><div><h4>Paiement sécurisé</h4><p>Mobile money ou à la livraison</p></div></div>
            <div class="item"><div class="rond">↩️</div><div><h4>Commande suivie</h4><p>Suivez votre commande en temps réel</p></div></div>
          </div>
        </div>
      </div>

      ${memeVendeur.length ? `
      <section class="section">
        <div class="entete-section"><div><h2>Autres produits de ce vendeur</h2></div></div>
        <div class="grille-produits">${memeVendeur.map(carteProduitHtml).join('')}</div>
      </section>` : ''}
    `;
  },
};

/* ---------- Panier ---------- */
Vues.panier = {
  async rendre() {
    if (Etat.panier.length === 0) {
      return `
        <div class="page-vide" style="margin-top:36px">
          <div class="grand">🛒</div>
          <h3>Votre panier est vide</h3>
          <p>Parcourez le catalogue et ajoutez des produits pour commencer.</p>
          <a class="btn btn-primaire" href="#/">Voir les produits</a>
        </div>`;
    }
    const lignes = Etat.panier
      .map(
        (l) => `
      <div class="ligne-panier">
        <a class="vignette" href="#/produit/${e(l.produitId)}">
          ${l.image ? `<img src="${e(l.image)}" alt="${e(l.nom)}" />` : '<div class="carte-image-placeholder" style="font-size:1.1rem">📦</div>'}
        </a>
        <div class="infos">
          <a href="#/produit/${e(l.produitId)}">${e(l.nom)}</a>
          <div class="prix">${fc(l.prix)}</div>
          <div class="aide">${e(l.ville || '')}</div>
        </div>
        <div class="quantite-ctrl" data-ligne="${e(l.produitId)}">
          <button data-panier-moins="${e(l.produitId)}" aria-label="Diminuer">−</button>
          <span>${l.quantite}</span>
          <button data-panier-plus="${e(l.produitId)}" aria-label="Augmenter">+</button>
        </div>
        <strong style="min-width:110px;text-align:right">${fc(l.prix * l.quantite)}</strong>
        <button class="btn btn-danger btn-petit" data-panier-retirer="${e(l.produitId)}">✕</button>
      </div>`
      )
      .join('');

    return `
      <section class="section">
        <div class="entete-section">
          <div><h2>Mon panier</h2><p>${nbArticlesPanier()} article(s) · Vérifiez vos articles avant de commander</p></div>
          <a class="lien-voir" href="#/">Continuer mes achats</a>
        </div>
        <div class="grille-commande">
          <div>${lignes}</div>
          <aside class="recapitulatif">
            <h3>Récapitulatif</h3>
            <div class="recap-ligne"><span>Sous-total</span><strong>${fc(totalPanier())}</strong></div>
            <div class="recap-ligne"><span>Livraison</span><strong>À convenir avec le vendeur</strong></div>
            <div class="recap-total"><span>Total</span><span>${fc(totalPanier())}</span></div>
            <a class="btn btn-primaire btn-bloc" href="#/commande" style="margin-top:18px">Passer la commande</a>
            <p class="aide" style="margin-top:12px;text-align:center">Paiement : M-Pesa, Orange Money, Airtel Money, Africell Money ou à la livraison</p>
          </aside>
        </div>
      </section>`;
  },
};

/* ---------- Checkout ---------- */
Vues.commande = {
  async rendre() {
    if (!Etat.utilisateur) {
      toast('Connectez-vous pour passer commande', 'erreur');
      location.hash = '#/connexion?suivant=' + encodeURIComponent('#/commande');
      return '';
    }
    if (Etat.panier.length === 0) {
      location.hash = '#/panier';
      return '';
    }
    const u = Etat.utilisateur;
    const couleurs = ['#e8710a', '#e8618c', '#d22b2b', '#7c4dff', '#148a54'];
    return `
      <section class="section">
        <div class="entete-section"><div><h2>Finaliser la commande</h2><p>Adresse de livraison et moyen de paiement</p></div></div>
        <form class="grille-commande" id="form-commande">
          <div class="carte-formulaire">
            <h3 style="margin-bottom:16px">📍 Adresse de livraison</h3>
            <div class="ligne-champs">
              <div class="champ"><label for="cmd-nom">Nom complet</label>
                <input id="cmd-nom" name="nom" required value="${e(u.nom)}" placeholder="Votre nom complet" /></div>
              <div class="champ"><label for="cmd-tel">Téléphone</label>
                <input id="cmd-tel" name="telephone" required value="${e(u.telephone)}" placeholder="+243 …" /></div>
            </div>
            <div class="ligne-champs">
              <div class="champ"><label for="cmd-ville">Ville</label>
                <select id="cmd-ville" name="ville" required>
                  ${Etat.referentiels.villes.map((v) => `<option ${v === u.ville ? 'selected' : ''}>${e(v)}</option>`).join('')}
                </select></div>
              <div class="champ"><label for="cmd-quartier">Quartier / Avenue</label>
                <input id="cmd-quartier" name="quartier" required placeholder="Ex : Birere, Q. Katindo" /></div>
            </div>
            <div class="champ"><label for="cmd-indication">Indication pour la livraison (optionnel)</label>
              <input id="cmd-indication" name="indication" placeholder="Ex : près de l'église, maison bleue…" /></div>

            <h3 style="margin:26px 0 14px">💳 Moyen de paiement</h3>
            <div class="radio-groupe" id="groupe-paiement">
              ${Etat.referentiels.methodesPaiement
                .map(
                  (m, i) => `
                <label class="radio-carte ${i === 0 ? 'coche' : ''}">
                  <input type="radio" name="methodePaiement" value="${e(m)}" ${i === 0 ? 'checked' : ''} />
                  <span class="icone-paiement" style="background:${couleurs[i % couleurs.length]}">${e(initiales(m))}</span>
                  <span><strong>${e(m)}</strong><span>${m.includes('livraison') ? 'Payez en espèces à la réception' : 'Vous recevrez les instructions de paiement après la commande'}</span></span>
                </label>`
                )
                .join('')}
            </div>
          </div>

          <aside class="recapitulatif">
            <h3>Votre commande</h3>
            ${Etat.panier
              .map(
                (l) => `<div class="recap-ligne"><span>${e(l.nom)} × ${l.quantite}</span><strong>${fc(l.prix * l.quantite)}</strong></div>`
              )
              .join('')}
            <div class="recap-total"><span>Total</span><span>${fc(totalPanier())}</span></div>
            <button class="btn btn-jaune btn-bloc" type="submit" style="margin-top:18px">Confirmer la commande</button>
            <p class="aide" style="margin-top:12px;text-align:center">En confirmant, vous acceptez nos conditions d'utilisation.</p>
          </aside>
        </form>
      </section>`;
  },
  apres() {
    const form = document.getElementById('form-commande');
    if (!form) return;

    form.addEventListener('change', (ev) => {
      if (ev.target.name === 'methodePaiement') {
        document.querySelectorAll('#groupe-paiement .radio-carte').forEach((el) => el.classList.remove('coche'));
        ev.target.closest('.radio-carte').classList.add('coche');
      }
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      try {
        const { commande } = await api('/api/commandes', {
          method: 'POST',
          corps: {
            items: Etat.panier.map((l) => ({ produitId: l.produitId, quantite: l.quantite })),
            adresse: {
              nom: fd.get('nom'),
              telephone: fd.get('telephone'),
              ville: fd.get('ville'),
              quartier: fd.get('quartier'),
              indication: fd.get('indication'),
            },
            methodePaiement: fd.get('methodePaiement'),
          },
        });
        Etat.panier = [];
        sauverPanier();
        location.hash = `#/confirmation/${commande.id}`;
      } catch (err) {
        toast(err.message, 'erreur');
      }
    });
  },
};

/* ---------- Confirmation ---------- */
Vues.confirmation = {
  async rendre(params, chemin) {
    const id = chemin.split('/')[2];
    const { commandes } = await api('/api/commandes');
    const c = commandes.find((x) => x.id === id);
    if (!c) return `<div class="page-vide" style="margin-top:36px"><h3>Commande introuvable</h3></div>`;
    return `
      <div class="confirmation-box">
        <div class="coche">
          <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2>Commande confirmée !</h2>
        <p style="color:var(--texte-doux);margin-top:8px">Merci pour votre achat sur Bwaka.cd. Les vendeurs vont traiter votre commande dans les plus brefs délais.</p>
        <div class="numero">${e(c.numero)}</div>
        <p>Montant total : <strong>${fc(c.total)}</strong> · Paiement : <strong>${e(c.methodePaiement)}</strong></p>
        <p class="aide" style="margin-top:6px">Livraison : ${e(c.adresse.quartier)}, ${e(c.adresse.ville)} — ${e(c.adresse.telephone)}</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <a class="btn btn-primaire" href="#/mes-commandes">Suivre ma commande</a>
          <a class="btn btn-ghost" href="#/">Continuer mes achats</a>
        </div>
      </div>`;
  },
};

/* ---------- Connexion / Inscription ---------- */
Vues.connexion = {
  async rendre() {
    return `
      <div class="page-auth">
        <div class="carte-formulaire">
          <div class="onglets-auth">
            <a href="#/connexion" class="actif">Connexion</a>
            <a href="#/inscription">Inscription</a>
          </div>
          <h2>Bienvenue 👋</h2>
          <p class="sous-titre">Connectez-vous pour acheter, vendre et suivre vos commandes.</p>
          <form id="form-connexion">
            <div class="champ"><label for="co-email">E-mail</label>
              <input id="co-email" name="email" type="email" required placeholder="vous@exemple.cd" /></div>
            <div class="champ"><label for="co-mdp">Mot de passe</label>
              <input id="co-mdp" name="motDePasse" type="password" required placeholder="••••••••" /></div>
            <button class="btn btn-primaire btn-bloc" type="submit">Se connecter</button>
          </form>
          <div class="compte-demo">
            <strong>Comptes de démonstration (mot de passe : demo123)</strong>
            jean@bwaka.cd · grace@bwaka.cd · esperance@bwaka.cd
          </div>
        </div>
      </div>`;
  },
  apres() {
    const form = document.getElementById('form-connexion');
    form?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      try {
        const { token, utilisateur } = await api('/api/auth/connexion', {
          method: 'POST',
          corps: { email: fd.get('email'), motDePasse: fd.get('motDePasse') },
        });
        Etat.token = token;
        Etat.utilisateur = utilisateur;
        sauverSession();
        toast(`Bienvenue, ${utilisateur.nom} !`, 'succes');
        const suivant = new URLSearchParams(location.hash.split('?')[1] || '').get('suivant');
        location.hash = suivant || '#/';
        majZoneCompte();
      } catch (err) {
        toast(err.message, 'erreur');
      }
    });
  },
};

Vues.inscription = {
  async rendre() {
    return `
      <div class="page-auth">
        <div class="carte-formulaire">
          <div class="onglets-auth">
            <a href="#/connexion">Connexion</a>
            <a href="#/inscription" class="actif">Inscription</a>
          </div>
          <h2>Devenir membre 🎉</h2>
          <p class="sous-titre">L'inscription est gratuite et ouverte à tous. Vendez vos produits partout en RDC.</p>
          <form id="form-inscription">
            <div class="champ"><label for="in-nom">Nom complet</label>
              <input id="in-nom" name="nom" required placeholder="Ex : Marie Kabeya" /></div>
            <div class="champ"><label for="in-email">E-mail</label>
              <input id="in-email" name="email" type="email" required placeholder="vous@exemple.cd" /></div>
            <div class="ligne-champs">
              <div class="champ"><label for="in-tel">Téléphone</label>
                <input id="in-tel" name="telephone" required placeholder="+243 …" /></div>
              <div class="champ"><label for="in-ville">Ville</label>
                <select id="in-ville" name="ville" required>
                  ${Etat.referentiels.villes.map((v) => `<option>${e(v)}</option>`).join('')}
                </select></div>
            </div>
            <div class="champ"><label for="in-mdp">Mot de passe</label>
              <input id="in-mdp" name="motDePasse" type="password" required minlength="6" placeholder="6 caractères minimum" />
              <div class="aide">Vous pourrez immédiatement mettre en vente vos produits après inscription.</div>
            </div>
            <button class="btn btn-jaune btn-bloc" type="submit">Créer mon compte membre</button>
          </form>
        </div>
      </div>`;
  },
  apres() {
    const form = document.getElementById('form-inscription');
    form?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      try {
        const { token, utilisateur } = await api('/api/auth/inscription', {
          method: 'POST',
          corps: {
            nom: fd.get('nom'),
            email: fd.get('email'),
            telephone: fd.get('telephone'),
            ville: fd.get('ville'),
            motDePasse: fd.get('motDePasse'),
          },
        });
        Etat.token = token;
        Etat.utilisateur = utilisateur;
        sauverSession();
        toast(`Bienvenue sur Bwaka, ${utilisateur.nom} ! Votre compte vendeur est actif.`, 'succes');
        location.hash = '#/vendre';
        majZoneCompte();
      } catch (err) {
        toast(err.message, 'erreur');
      }
    });
  },
};

/* ---------- Vendre (publier un produit) ---------- */
Vues.vendre = {
  async rendre() {
    if (!Etat.utilisateur) {
      return `
        <div class="page-vide" style="margin-top:36px">
          <div class="grand">💰</div>
          <h3>Vendez sur Bwaka</h3>
          <p>Créez votre compte membre gratuitement pour mettre vos produits en vente partout en RDC.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <a class="btn btn-jaune" href="#/inscription">Créer un compte vendeur</a>
            <a class="btn btn-ghost" href="#/connexion">J'ai déjà un compte</a>
          </div>
        </div>`;
    }
    return `
      <section class="section">
        <div class="entete-section">
          <div><h2>Mettre un produit en vente</h2><p>Remplissez le formulaire — votre annonce sera visible immédiatement</p></div>
          <a class="lien-voir" href="#/mes-produits">Gérer mes produits</a>
        </div>
        <form class="carte-formulaire" id="form-vendre" style="max-width:760px">
          <div class="champ"><label for="v-nom">Nom du produit</label>
            <input id="v-nom" name="nom" required placeholder="Ex : Smartphone Samsung Galaxy A15" /></div>
          <div class="champ"><label for="v-desc">Description</label>
            <textarea id="v-desc" name="description" required placeholder="Décrivez votre produit : état, caractéristiques, garantie…"></textarea></div>
          <div class="ligne-champs">
            <div class="champ"><label for="v-prix">Prix (FC)</label>
              <input id="v-prix" name="prix" type="number" min="1" step="1" required placeholder="Ex : 185000" /></div>
            <div class="champ"><label for="v-qte">Quantité disponible</label>
              <input id="v-qte" name="quantite" type="number" min="1" step="1" value="1" required /></div>
          </div>
          <div class="ligne-champs">
            <div class="champ"><label for="v-cat">Catégorie</label>
              <select id="v-cat" name="categorie" required>
                ${Etat.referentiels.categories.map((c) => `<option>${e(c)}</option>`).join('')}
              </select></div>
            <div class="champ"><label for="v-ville">Ville</label>
              <select id="v-ville" name="ville" required>
                ${Etat.referentiels.villes.map((v) => `<option ${v === Etat.utilisateur.ville ? 'selected' : ''}>${e(v)}</option>`).join('')}
              </select></div>
          </div>
          <div class="champ"><label for="v-image">Photo du produit (optionnel)</label>
            <input id="v-image" name="image" type="file" accept="image/*" />
            <div class="aide">JPG ou PNG, 5 Mo maximum. Une belle photo augmente vos ventes !</div>
          </div>
          <button class="btn btn-jaune" type="submit" style="margin-top:8px">Publier mon produit</button>
        </form>
      </section>`;
  },
  apres() {
    const form = document.getElementById('form-vendre');
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const bouton = form.querySelector('button[type=submit]');
      bouton.disabled = true;
      try {
        let imageUrl = null;
        const fichier = fd.get('image');
        if (fichier && fichier.size > 0) {
          const up = new FormData();
          up.append('image', fichier);
          const res = await api('/api/upload', { method: 'POST', corps: up });
          imageUrl = res.url;
        }
        await api('/api/produits', {
          method: 'POST',
          corps: {
            nom: fd.get('nom'),
            description: fd.get('description'),
            prix: fd.get('prix'),
            quantite: fd.get('quantite'),
            categorie: fd.get('categorie'),
            ville: fd.get('ville'),
            image: imageUrl,
          },
        });
        toast('Votre produit est maintenant en vente 🎉', 'succes');
        location.hash = '#/mes-produits';
      } catch (err) {
        toast(err.message, 'erreur');
        bouton.disabled = false;
      }
    });
  },
};

/* ---------- Mes produits ---------- */
Vues.mesProduits = {
  async rendre() {
    if (!Etat.utilisateur) {
      location.hash = '#/connexion?suivant=' + encodeURIComponent('#/mes-produits');
      return '';
    }
    const { produits } = await api(`/api/produits?vendeur=${Etat.utilisateur.id}`);
    return `
      <section class="section">
        <div class="entete-section">
          <div><h2>Mes produits en vente</h2><p>${produits.length} produit(s) publiés</p></div>
          <a class="btn btn-jaune" href="#/vendre">+ Nouveau produit</a>
        </div>
        ${produits.length === 0
          ? `<div class="page-vide"><div class="grand">📦</div><h3>Vous n'avez pas encore de produit</h3><p>Publiez votre première annonce pour commencer à vendre.</p><a class="btn btn-primaire" href="#/vendre">Vendre un produit</a></div>`
          : `<table class="tableau-simple">
              <thead><tr><th>Produit</th><th>Prix</th><th>Stock</th><th>Ville</th><th>Actions</th></tr></thead>
              <tbody>
                ${produits
                  .map(
                    (p) => `
                  <tr>
                    <td><a href="#/produit/${e(p.id)}" style="font-weight:650">${e(p.nom)}</a><div class="aide">${e(p.categorie)}</div></td>
                    <td><strong>${fc(p.prix)}</strong></td>
                    <td>${p.quantite}</td>
                    <td>${e(p.ville)}</td>
                    <td><div class="actions">
                      <a class="btn btn-ghost btn-petit" href="#/produit/${e(p.id)}">Voir</a>
                      <button class="btn btn-danger btn-petit" data-supprimer-produit="${e(p.id)}">Supprimer</button>
                    </div></td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>`}
      </section>`;
  },
};

/* ---------- Mes commandes (acheteur) ---------- */
function commandeCarteHtml(c, modeVendeur = false) {
  return `
    <div class="carte-commande">
      <div class="entete-cmd">
        <div>
          <span class="numero">${e(c.numero)}</span>
          <div class="date">Commandé le ${e(dateHeure(c.createdAt))}</div>
        </div>
        ${badgeStatut(c.statut)}
      </div>
      ${c.items
        .map(
          (i) => `
        <div class="item-commande">
          <div class="vignette">${i.image ? `<img src="${e(i.image)}" alt="${e(i.nom)}" />` : '<div class="carte-image-placeholder" style="font-size:.9rem">📦</div>'}</div>
          <div class="nom">${e(i.nom)} <span style="color:var(--texte-doux);font-weight:500">× ${i.quantite}</span></div>
          <div class="prix">${fc(i.prix * i.quantite)}</div>
        </div>`
        )
        .join('')}
      <div class="pied-commande">
        <div class="infos-livraison">
          ${modeVendeur
            ? `Acheteur : ${e(c.adresse.nom)} · ${e(c.adresse.telephone)}<br/>Livraison : ${e(c.adresse.quartier)}, ${e(c.adresse.ville)}${c.adresse.indication ? ` — ${e(c.adresse.indication)}` : ''}`
            : `Livraison : ${e(c.adresse.quartier)}, ${e(c.adresse.ville)} · ${e(c.methodePaiement)}`}
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <span class="total">${fc(modeVendeur ? c.items.reduce((s, i) => s + i.prix * i.quantite, 0) : c.total)}</span>
          ${modeVendeur
            ? `<div class="actions" style="display:flex;gap:8px">
                ${c.statut === 'en_attente' ? `<button class="btn btn-primaire btn-petit" data-statut="${e(c.id)}|confirmee">Confirmer</button>` : ''}
                ${c.statut === 'confirmee' ? `<button class="btn btn-primaire btn-petit" data-statut="${e(c.id)}|expediee">Marquer expédiée</button>` : ''}
                ${c.statut === 'expediee' ? `<button class="btn btn-jaune btn-petit" data-statut="${e(c.id)}|livree">Marquer livrée</button>` : ''}
                ${['en_attente', 'confirmee'].includes(c.statut) ? `<button class="btn btn-danger btn-petit" data-statut="${e(c.id)}|annulee">Annuler</button>` : ''}
              </div>`
            : `${c.statut === 'en_attente' ? `<button class="btn btn-danger btn-petit" data-statut="${e(c.id)}|annulee">Annuler</button>` : ''}`}
        </div>
      </div>
    </div>`;
}

Vues.mesCommandes = {
  async rendre() {
    if (!Etat.utilisateur) {
      location.hash = '#/connexion?suivant=' + encodeURIComponent('#/mes-commandes');
      return '';
    }
    const { commandes } = await api('/api/commandes');
    return `
      <section class="section">
        <div class="entete-section"><div><h2>Mes commandes</h2><p>Suivez l'état de vos achats</p></div></div>
        ${commandes.length === 0
          ? `<div class="page-vide"><div class="grand">📋</div><h3>Aucune commande pour le moment</h3><p>Vos commandes apparaîtront ici.</p><a class="btn btn-primaire" href="#/">Commencer mes achats</a></div>`
          : commandes.map((c) => commandeCarteHtml(c)).join('')}
      </section>`;
  },
};

/* ---------- Mes ventes (vendeur) ---------- */
Vues.mesVentes = {
  async rendre() {
    if (!Etat.utilisateur) {
      location.hash = '#/connexion?suivant=' + encodeURIComponent('#/ventes');
      return '';
    }
    const [stats, ventes] = await Promise.all([api('/api/stats'), api('/api/ventes')]);
    return `
      <section class="section">
        <div class="entete-section">
          <div><h2>Tableau de bord vendeur</h2><p>Bonjour ${e(Etat.utilisateur.nom)}, voici l'activité de votre boutique</p></div>
          <a class="btn btn-jaune" href="#/vendre">+ Vendre un produit</a>
        </div>

        <div class="grille-stats">
          <div class="carte-stat">
            <div class="rond" style="background:var(--bleu-clair);color:var(--bleu)">📦</div>
            <div><div class="valeur">${stats.produitsActifs}</div><div class="libelle">Produits actifs</div></div>
          </div>
          <div class="carte-stat">
            <div class="rond" style="background:#fff4dc;color:#9a6b00">🧾</div>
            <div><div class="valeur">${stats.ventes}</div><div class="libelle">Commandes reçues</div></div>
          </div>
          <div class="carte-stat">
            <div class="rond" style="background:#e3f6ec;color:var(--vert)">💵</div>
            <div><div class="valeur">${fc(stats.chiffreAffaires)}</div><div class="libelle">Chiffre d'affaires</div></div>
          </div>
          <div class="carte-stat">
            <div class="rond" style="background:#fdecec;color:var(--rouge)">🗂</div>
            <div><div class="valeur">${stats.totalProduits}</div><div class="libelle">Produits publiés</div></div>
          </div>
        </div>

        <div class="entete-section"><div><h2 style="font-size:1.25rem">Commandes reçues</h2></div>
          <a class="lien-voir" href="#/mes-produits">Gérer mes produits</a></div>
        ${stats.ventes === 0
          ? `<div class="page-vide"><div class="grand">🛍️</div><h3>Pas encore de vente</h3><p>Partagez vos annonces pour attirer des acheteurs.</p><a class="btn btn-primaire" href="#/vendre">Publier un produit</a></div>`
          : ventes.map((c) => commandeCarteHtml(c, true)).join('')}
      </section>`;
  },
};
