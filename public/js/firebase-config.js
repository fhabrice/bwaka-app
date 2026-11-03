'use strict';

/* ============ Configuration Firebase ============
   PROJET : bwaka-ac664 (visible dans votre console Firebase)
   
   Remplacez les valeurs ci-dessous par celles de votre projet Firebase.
   Elles se trouvent dans la Console Firebase >
   Paramètres du projet > Vos applications > SDK Firebase > Configuration
   (bouton </> Config). */

const firebaseConfig = {
  apiKey: '',        // <-- À remplir (ex: "AIzaSy...")
  authDomain: 'bwaka-ac664.firebaseapp.com',
  projectId: 'bwaka-ac664',
  storageBucket: 'bwaka-ac664.appspot.com',
  messagingSenderId: '', // <-- À remplir
  appId: '',         // <-- À remplir (ex: "1:...:web:...")
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
