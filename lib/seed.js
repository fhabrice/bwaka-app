'use strict';

const { hashPassword } = require('./auth');

const CATEGORIES = [
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
];

const METHODES_PAIEMENT = [
  'M-Pesa (Vodacom)',
  'Orange Money',
  'Airtel Money',
  'Africell Money',
  'Paiement à la livraison',
];

const VILLES = [
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
];

function buildSeed() {
  const mdp = hashPassword('demo123');

  const utilisateurs = [
    {
      id: 'u1',
      nom: 'Jean Bosco Nsimba',
      email: 'jean@bwaka.cd',
      telephone: '+243 970 000 001',
      ville: 'Goma',
      motDePasse: mdp,
      createdAt: '2026-09-12T08:00:00.000Z',
    },
    {
      id: 'u2',
      nom: 'Grace Mbuyi',
      email: 'grace@bwaka.cd',
      telephone: '+243 990 000 002',
      ville: 'Kinshasa',
      motDePasse: mdp,
      createdAt: '2026-09-20T10:30:00.000Z',
    },
    {
      id: 'u3',
      nom: 'Espérance Kavira',
      email: 'esperance@bwaka.cd',
      telephone: '+243 971 000 003',
      ville: 'Bukavu',
      motDePasse: mdp,
      createdAt: '2026-10-01T14:15:00.000Z',
    },
  ];

  const produits = [
    {
      id: 'p1',
      nom: 'Smartphone Samsung Galaxy A15 128 Go',
      description:
        "Smartphone neuf, double SIM, batterie 5000 mAh, appareil photo 50 MP. Garantie 6 mois disponible à Goma. Livraison possible dans toute la ville.",
      prix: 185000,
      categorie: 'Téléphonie',
      quantite: 12,
      image: '/images/telephone.jpg',
      vendeurId: 'u1',
      ville: 'Goma',
      statut: 'actif',
      createdAt: '2026-10-05T09:00:00.000Z',
    },
    {
      id: 'p2',
      nom: 'Ordinateur HP EliteBook 840 G5 (occasion)',
      description:
        "PC portable en excellent état : Core i5 8e génération, 16 Go RAM, SSD 512 Go. Idéal pour le bureau et les études. Testé et garanti 3 mois.",
      prix: 1250000,
      categorie: 'Électronique',
      quantite: 4,
      image: '/images/ordinateur.jpg',
      vendeurId: 'u2',
      ville: 'Kinshasa',
      statut: 'actif',
      createdAt: '2026-10-08T11:20:00.000Z',
    },
    {
      id: 'p3',
      nom: 'Robe en pagne wax tailée sur mesure',
      description:
        "Belle robe confectionnée à la main en pagne wax authentique. Plusieurs motifs disponibles, toutes tailles. Commande sur mesure en 3 jours.",
      prix: 45000,
      categorie: 'Mode & Vêtements',
      quantite: 20,
      image: '/images/robe.jpg',
      vendeurId: 'u3',
      ville: 'Bukavu',
      statut: 'actif',
      createdAt: '2026-10-11T08:45:00.000Z',
    },
    {
      id: 'p4',
      nom: 'Baskets sport mode (toutes tailles)',
      description:
        "Baskets légères et confortables, semelle antidérapante. Parfaites pour le sport et le quotidien. Disponibles du 38 au 45.",
      prix: 60000,
      categorie: 'Mode & Vêtements',
      quantite: 15,
      image: '/images/baskets.jpg',
      vendeurId: 'u2',
      ville: 'Kinshasa',
      statut: 'actif',
      createdAt: '2026-10-12T16:00:00.000Z',
    },
    {
      id: 'p5',
      nom: 'Café Arabica du Kivu — paquet 1 kg',
      description:
        "Café Arabica de spécialité cultivé dans les hauts plateaux du Kivu. Torréfaction artisanale, goût fruité et corsé. Grains entiers ou moulu.",
      prix: 25000,
      categorie: 'Alimentation',
      quantite: 40,
      image: '/images/cafe.jpg',
      vendeurId: 'u1',
      ville: 'Bukavu',
      statut: 'actif',
      createdAt: '2026-10-15T07:30:00.000Z',
    },
    {
      id: 'p6',
      nom: 'Kit solaire 100 W + batterie + lampes',
      description:
        "Autonomie électrique partout : panneau 100 W, batterie 12 V, 3 lampes LED et port USB pour recharger les téléphones. Installation simple.",
      prix: 280000,
      categorie: 'Maison & Énergie',
      quantite: 8,
      image: '/images/solaire.jpg',
      vendeurId: 'u1',
      ville: 'Goma',
      statut: 'actif',
      createdAt: '2026-10-18T12:00:00.000Z',
    },
    {
      id: 'p7',
      nom: 'Panier de légumes frais (livraison Goma)',
      description:
        "Panier familial : tomates, oignons, feuilles de manioc, aubergines amères, haricots. Récolte du jour, livraison à domicile dans Goma.",
      prix: 15000,
      categorie: 'Alimentation',
      quantite: 25,
      image: null,
      vendeurId: 'u3',
      ville: 'Goma',
      statut: 'actif',
      createdAt: '2026-10-20T06:15:00.000Z',
    },
    {
      id: 'p8',
      nom: 'Savon naturel à l’huile de palme (lot de 6)',
      description:
        "Savon artisanal 100 % naturel, fabriqué à Bunia. Nourrit la peau, parfum agréable. Lot de 6 savons de 150 g.",
      prix: 9000,
      categorie: 'Beauté & Santé',
      quantite: 30,
      image: null,
      vendeurId: 'u3',
      ville: 'Bunia',
      statut: 'actif',
      createdAt: '2026-10-21T09:40:00.000Z',
    },
    {
      id: 'p9',
      nom: 'Casque Bluetooth sans fil',
      description:
        "Son clair et basses profondes, autonomie 20 heures, connexion Bluetooth 5.3 avec micro pour les appels. Charge rapide USB-C.",
      prix: 35000,
      categorie: 'Électronique',
      quantite: 18,
      image: null,
      vendeurId: 'u2',
      ville: 'Lubumbashi',
      statut: 'actif',
      createdAt: '2026-10-22T15:10:00.000Z',
    },
    {
      id: 'p10',
      nom: 'Miel pur de l’Ituri — pot 500 g',
      description:
        "Miel sauvage récolté en forêt de l’Ituri, sans ajout ni traitement. Idéal pour le thé, les tartines et les soins naturels.",
      prix: 18000,
      categorie: 'Alimentation',
      quantite: 22,
      image: null,
      vendeurId: 'u3',
      ville: 'Bunia',
      statut: 'actif',
      createdAt: '2026-10-23T10:00:00.000Z',
    },
    {
      id: 'p11',
      nom: 'Terrain 400 m² titré à Birere (Goma)',
      description:
        "Terrain plat et titré, situé à Birere, proche de la route principale. Idéal pour maison ou commerce. Visite possible sur rendez-vous.",
      prix: 8500000,
      categorie: 'Immobilier',
      quantite: 1,
      image: null,
      vendeurId: 'u1',
      ville: 'Goma',
      statut: 'actif',
      createdAt: '2026-10-24T13:25:00.000Z',
    },
    {
      id: 'p12',
      nom: 'Cours de soutien scolaire (maths & physique)',
      description:
        "Cours particuliers pour élèves du secondaire, à domicile ou en ligne. Enseignant expérimenté, démonstration gratuite d’une heure.",
      prix: 30000,
      categorie: 'Services',
      quantite: 10,
      image: null,
      vendeurId: 'u2',
      ville: 'Kinshasa',
      statut: 'actif',
      createdAt: '2026-10-25T08:00:00.000Z',
    },
  ];

  return {
    utilisateurs,
    produits,
    commandes: [],
    compteurs: { commande: 1000 },
    categories: CATEGORIES,
    methodesPaiement: METHODES_PAIEMENT,
    villes: VILLES,
  };
}

module.exports = { buildSeed, CATEGORIES, METHODES_PAIEMENT, VILLES };
