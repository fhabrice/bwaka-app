'use strict';

/* ============ Configuration Firebase ============
   Remplacez les valeurs ci-dessous par celles de votre projet Firebase.
   Elles se trouvent dans la Console Firebase >
   Paramètres du projet > Vos applications > SDK Firebase > Configuration. */

const firebaseConfig = {
  // Exemple à remplacer :
  // apiKey: "AIzaSy...",
  // authDomain: "bwaka-app.firebaseapp.com",
  // projectId: "bwaka-app",
  // storageBucket: "bwaka-app.appspot.com",
  // messagingSenderId: "123456789012",
  // appId: "1:123456789012:web:abcdef012345678",
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

let app = null;
let db = null;
let auth = null;
let storage = null;

function initialiserFirebase() {
  if (!firebaseConfig.projectId || firebaseConfig.projectId === '') {
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
