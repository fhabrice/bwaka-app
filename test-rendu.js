const { JSDOM, VirtualConsole } = require('jsdom');

const BASE = 'http://localhost:3000';

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const erreurs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erreurs.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => erreurs.push('console.error: ' + a.join(' ')));

  // Nota : cette version de test ne configure pas Firebase (clés requises).
  // Elle vérifie uniquement que le SPA se charge, que le routeur initialise
  // et que les pages d'authentification / panier vide s'affichent sans erreur JS.
  // Les vues qui appellent l'API (catalogue, produit, commande…) nécessitent
  // un projet Firebase configuré (public/js/firebase-config.js).

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
  const document = window.document;
  await wait(2500);

  const app = document.getElementById('app');
  const html = app ? app.innerHTML : '(pas de #app)';

  const checks = [
    ['app: #app présent', !!app],
    ['app: pas d\'erreur JS au chargement', !html.includes('Une erreur est survenue')],
    ['header: nav inscription', document.body.innerHTML.includes("S'inscrire")],
    ['badge panier existe', !!document.getElementById('badge-panier')],
  ];

  for (const [libelle, ok] of checks) console.log((ok ? 'OK ' : 'FAIL ') + libelle);

  // Pages qui n'ont pas besoin de l'API Firebase
  const routesStatiques = [
    ['#/connexion', 'connexion', 'form-connexion'],
    ['#/inscription', 'inscription', 'form-inscription'],
    ['#/panier', 'panier (vide)', 'panier est vide'],
  ];

  for (const [hash, nom, marqueur] of routesStatiques) {
    window.location.hash = hash;
    await wait(800);
    const h2 = document.getElementById('app').innerHTML;
    const ok = !h2.includes('Une erreur est survenue') && h2.length > 100;
    console.log((ok ? 'OK  ' : 'FAIL ') + 'page ' + nom + ' rendu' + (ok ? '' : ' (voir ci-dessus)'));
  }

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
