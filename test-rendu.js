const { JSDOM, VirtualConsole } = require('jsdom');

const BASE = 'http://localhost:3000';

async function main() {
  const erreurs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erreurs.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => erreurs.push('console.error: ' + a.join(' ')));

  const dom = await JSDOM.fromURL(BASE + '/', {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.fetch = (url, opts) => fetch(new URL(url, BASE), opts);
      window.scrollTo = () => {};
      window.confirm = () => true;
    },
  });

  const { window } = dom;
  await new Promise((r) => setTimeout(r, 2500));

  const app = window.document.getElementById('app');
  const html = app ? app.innerHTML : '(pas de #app)';

  const checks = [
    ['accueil: hero présent', html.includes('Vendez et achetez')],
    ['accueil: produits rendus', html.includes('carte-produit')],
    ['accueil: prix FC', html.includes('FC')],
    ['accueil: catégories', html.includes('tuile-categorie')],
    ['header: nav inscription', window.document.body.innerHTML.includes('S&#39;inscrire') || window.document.body.innerHTML.includes("S'inscrire")],
    ['badge panier existe', !!window.document.getElementById('badge-panier')],
    ['barre catégories remplie', window.document.getElementById('barre-categories').innerHTML.includes('puce-categorie')],
  ];

  for (const [libelle, ok] of checks) console.log((ok ? 'OK ' : 'FAIL ') + libelle);

  // Navigation vers page produit
  const lienProduit = window.document.querySelector('.carte-titre');
  if (lienProduit) {
    window.location.hash = lienProduit.getAttribute('href');
    await new Promise((r) => setTimeout(r, 1500));
    const html2 = window.document.getElementById('app').innerHTML;
    console.log((html2.includes('detail-prix') ? 'OK  ' : 'FAIL ') + 'page produit: détail rendu');
    console.log((html2.includes('Ajouter au panier') ? 'OK  ' : 'FAIL ') + 'page produit: bouton panier');
  } else {
    console.log('FAIL page produit: aucun lien produit trouvé');
  }

  // Page panier
  window.location.hash = '#/panier';
  await new Promise((r) => setTimeout(r, 800));
  console.log((window.document.getElementById('app').innerHTML.includes('panier est vide') ? 'OK  ' : 'FAIL ') + 'page panier: rendu');

  // Inscription
  window.location.hash = '#/inscription';
  await new Promise((r) => setTimeout(r, 800));
  console.log((window.document.getElementById('form-inscription') ? 'OK  ' : 'FAIL ') + 'page inscription: formulaire');

  if (erreurs.length) {
    console.log('\n--- ERREURS JS ---');
    erreurs.forEach((e) => console.log(e));
  } else {
    console.log('\nAucune erreur JavaScript.');
  }
  window.close();
  process.exit(0);
}

main().catch((e) => { console.error('ERREUR TEST:', e); process.exit(1); });
