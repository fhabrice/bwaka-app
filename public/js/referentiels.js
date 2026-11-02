'use strict';

/* ============ Référentiels (statiques côté client) ============
   Ces listes étaient auparavant servies par GET /api/referentiels.
   Elles peuvent plus tard être stockées dans Firestore (collection 'referentiels')
   pour être modifiables sans redéploiement. */

const Referentiels = {
  categories: [
    'Électronique',
    'Téléphonie',
    'Mode & Vêtements',
    'Maison & Énergie',
    'Alimentation',
    'Beauté & Santé',
    'Agriculture',
    'Immobilier',
    'Services',
    'Autres',
  ],

  methodesPaiement: [
    'M-Pesa (Vodacom)',
    'Orange Money',
    'Airtel Money',
    'Africell Money',
    'Paiement à la livraison',
  ],

  villes: [
    'Goma',
    'Bukavu',
    'Kinshasa',
    'Lubumbashi',
    'Kisangani',
    'Matadi',
    'Mbuji-Mayi',
    'Kananga',
    'Bunia',
    'Kolwezi',
    'Likasi',
    'Uvira',
    'Butembo',
    'Beni',
    'Tshikapa',
    'Gemena',
  ],
};

window.Referentiels = Referentiels;
