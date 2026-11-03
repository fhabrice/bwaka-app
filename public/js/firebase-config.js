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
  measurementId: 'G-CYLHK75M6W'
};

let app = null;
let db = null;
let auth = null;
let storage = null;

function initialiserFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '') {
    console.warn('Firebase non configuré : remplissez public/js/firebase-config.js');
    return;
  }
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  // Exposition globale pour les autres scripts (pas de bundler dans ce projet)
  window.db = db;
  window.auth = auth;
  window.storage = storage;
}

initialiserFirebase();
