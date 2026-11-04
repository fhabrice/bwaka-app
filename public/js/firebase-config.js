'use strict';

/* ============ Configuration Firebase ============
   PROJET : bwaka-ac664
   Remplacez ces valeurs si nécessaire depuis la Console Firebase >
   Paramètres du projet > Vos applications > SDK Firebase > Configuration. */

const firebaseConfig = {
  apiKey: 'AIzaSyB1r8E4fYS2N7s1qYJeQbmHJ244iT1CYfo',
  authDomain: 'bwaka-ac664.firebaseapp.com',
  projectId: 'bwaka-ac664',
  storageBucket: 'bwaka-ac664.firebasestorage.app',
  messagingSenderId: '117703150598',
  appId: '1:117703150598:web:7f2db2aa6796d69b4f0787',
  measurementId: 'G-CYLHK75M6W',
};

window.firebaseConfig = firebaseConfig;

function initialiserFirebase() {
  // Respecte d'éventuelles instances pré-injectées (ex. tests automatisés)
  if (window.db && window.auth) return;

  if (!firebaseConfig.apiKey) {
    console.warn('Firebase non configuré : remplissez public/js/firebase-config.js');
    return;
  }

  if (typeof window.firebase === 'undefined' || typeof window.firebase.initializeApp !== 'function') {
    console.warn('SDK Firebase non chargé (mode hors-ligne ou CDN inaccessible).');
    return;
  }

  const app = window.firebase.apps && window.firebase.apps.length > 0
    ? window.firebase.app()
    : window.firebase.initializeApp(firebaseConfig);

  window.firebaseApp = app;
  window.db = window.firebase.firestore();
  window.auth = window.firebase.auth();
  window.storage = typeof window.firebase.storage === 'function' ? window.firebase.storage() : null;
}

initialiserFirebase();
