import { db } from './firebase';
import { 
  collection, getDocs, deleteDoc, doc, setDoc, addDoc 
} from 'firebase/firestore';
import { enregistrerAuditLog } from './auditLogger';

export interface ResultatPurge {
  succes: boolean;
  totalSupprimes: number;
  message: string;
}

export const ETABLISSEMENT_OFFICIEL_ID = 'etoile-du-congo-id';
export const SUPER_ADMIN_EMAIL = 'securitstech@gmail.com';
export const ADMIN_GERANT_EMAIL = 'admin@etoileducongo.com';

export const purgerEtReinitialiserTout = async (): Promise<ResultatPurge> => {
  const collectionsAVider = [
    'etablissements',
    'demandes_acces',
    'invitations',
    'tables',
    'produits',
    'commandes',
    'transactions',
    'transactions_pos',
    'paiements',
    'employes',
    'achats',
    'sessions',
    'sessions_caisse',
    'sessions_travail',
    'pointage_presence',
    'charges_fixes',
    'charges_recurrentes',
    'taxes_conformite',
    'messages_contact',
    'discipline',
    'avances',
    'paiements_fiscaux',
    'paiements_salaires',
    'audit_logs'
  ];

  let totalSupprimes = 0;

  try {
    // 1. Nettoyer les collections
    for (const nomCol of collectionsAVider) {
      try {
        const snap = await getDocs(collection(db, nomCol));
        for (const documentSnap of snap.docs) {
          await deleteDoc(documentSnap.ref);
          totalSupprimes++;
        }
      } catch (e) {
        console.warn(`Purge collection ${nomCol} ignorée ou vide:`, e);
      }
    }

    // 2. Nettoyer utilisateurs sauf Super Admin
    try {
      const snapUsers = await getDocs(collection(db, 'utilisateurs'));
      for (const d of snapUsers.docs) {
        const data = d.data();
        if (data.email !== SUPER_ADMIN_EMAIL && data.role !== 'super_admin') {
          await deleteDoc(d.ref);
          totalSupprimes++;
        }
      }
    } catch (e) {
      console.warn("Purge utilisateurs partielle:", e);
    }

    // 3. Créer l'établissement officiel propre
    const etabData = {
      id: ETABLISSEMENT_OFFICIEL_ID,
      nom: 'BAR-RESTAURANT "ÉTOILE DU CONGO"',
      contact_principal: 'Aimé Koumba (Gérant Direction)',
      email_contact: ADMIN_GERANT_EMAIL,
      telephone: '+242 06 881 7104',
      ville: 'Pointe-Noire',
      adresse: 'Avenue Charles de Gaulle, Centre-Ville, Pointe-Noire (Congo)',
      type_etablissement: 'bar_restaurant',
      subscription_plan: 'premium',
      subscription_status: 'actif',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      modules_actifs: [
        'dashboard', 'stocks', 'achats', 'saisie-journaliere', 'caisse-express',
        'caisse', 'finances', 'crm', 'equipe', 'planning', 'hybride', 'ia',
        'objectifs', 'alertes', 'parametres', 'conformite', 'comptabilite', 'securite-audit'
      ],
      tva_taux: 18,
      taxe_loisirs_taux: 5,
      taxe_tourisme_taux: 2,
      cnss_taux: 16.5,
      is_taux: 30,
      devise: 'XAF',
      date_creation: new Date().toISOString()
    };
    await setDoc(doc(db, 'etablissements', ETABLISSEMENT_OFFICIEL_ID), etabData);

    // 4. Créer le profil Super Admin
    await setDoc(doc(db, 'utilisateurs', 'super-admin-uid'), {
      id: 'super-admin-uid',
      email: SUPER_ADMIN_EMAIL,
      nom: 'Securits Tech Super Administrateur',
      role: 'super_admin',
      telephone: '+242 06 881 7104',
      date_creation: new Date().toISOString()
    });

    // 5. Créer le profil Client Admin (Gérant)
    await setDoc(doc(db, 'utilisateurs', 'admin-gerant-uid'), {
      id: 'admin-gerant-uid',
      email: ADMIN_GERANT_EMAIL,
      nom: 'Aimé Koumba (Gérant)',
      role: 'client_admin',
      etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
      etablissement_nom: 'BAR-RESTAURANT "ÉTOILE DU CONGO"',
      etablissement_status: 'actif',
      type_etablissement: 'bar_restaurant',
      telephone: '+242 06 881 7104',
      date_creation: new Date().toISOString()
    });

    // 6. Créer les employés officiels de l'établissement avec rôles et PINs
    const employesInitiaux = [
      {
        id: 'emp-gerant',
        nom: 'Aimé Koumba',
        role: 'admin',
        pin: '1234',
        salaire: 280000,
        typeSalaire: 'mensuel',
        telephone: '+242 06 881 7104',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
        actif: true
      },
      {
        id: 'emp-caissier',
        nom: 'Marlène Mavoungou',
        role: 'caissier',
        pin: '3003',
        salaire: 140000,
        typeSalaire: 'mensuel',
        telephone: '+242 05 555 1234',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
        actif: true
      },
      {
        id: 'emp-serveur-1',
        nom: 'Jean-Baptiste Samba',
        role: 'serveur',
        pin: '1001',
        salaire: 90000,
        typeSalaire: 'mensuel',
        telephone: '+242 06 999 4321',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
        actif: true
      },
      {
        id: 'emp-serveur-2',
        nom: 'Grâce Moukoko',
        role: 'serveur',
        pin: '1002',
        salaire: 90000,
        typeSalaire: 'mensuel',
        telephone: '+242 05 777 8899',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
        actif: true
      },
      {
        id: 'emp-cuisine',
        nom: 'Céleste Matingou (Chef)',
        role: 'cuisine',
        pin: '2002',
        salaire: 180000,
        typeSalaire: 'mensuel',
        telephone: '+242 06 444 3322',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
        actif: true
      }
    ];

    for (const emp of employesInitiaux) {
      await setDoc(doc(db, 'employes', emp.id), emp);
    }

    // 7. Créer les tables officielles
    const tablesInitiales = [
      { id: 'T01', nom: 'T01 - Salon VIP Climaté', zone: 'VIP', capacite: 6, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T02', nom: 'T02 - Salon VIP Lounge', zone: 'VIP', capacite: 8, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T03', nom: 'T03 - Terrasse Vue Avenue', zone: 'Terrasse', capacite: 4, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T04', nom: 'T04 - Terrasse Centrale', zone: 'Terrasse', capacite: 4, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T05', nom: 'T05 - Grande Salle', zone: 'Salle', capacite: 4, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T06', nom: 'T06 - Grande Salle', zone: 'Salle', capacite: 4, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T07', nom: 'T07 - Jardin Plein Air', zone: 'Jardin', capacite: 6, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { id: 'T08', nom: 'T08 - Comptoir Bar Central', zone: 'Comptoir', capacite: 8, statut: 'libre', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
    ];

    for (const t of tablesInitiales) {
      await setDoc(doc(db, 'tables', t.id), t);
    }

    // 8. Créer les produits avec gestion casier de 24 (SYSCOHADA 701/601) et Food Cost (SYSCOHADA 706/602)
    const produitsInitiaux = [
      {
        id: 'p-primus',
        nom: 'Primus 65cl (Bière Blonde)',
        categorie: 'boisson',
        pole: 'bar',
        prix: 1000,
        prixAchat: 550,
        coutMatiere: 550,
        uniteParCasier: 24,
        stock_actuel: 120, // 5 casiers de 24
        stock_alerte: 24,
        compteOHADA: '701000',
        image_url: '🍺',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-castel',
        nom: 'Castel Beer 65cl',
        categorie: 'boisson',
        pole: 'bar',
        prix: 1200,
        prixAchat: 650,
        coutMatiere: 650,
        uniteParCasier: 24,
        stock_actuel: 96, // 4 casiers de 24
        stock_alerte: 24,
        compteOHADA: '701000',
        image_url: '🍺',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-beaufort',
        nom: 'Beaufort Lager 50cl',
        categorie: 'boisson',
        pole: 'bar',
        prix: 1500,
        prixAchat: 800,
        coutMatiere: 800,
        uniteParCasier: 24,
        stock_actuel: 72,
        stock_alerte: 24,
        compteOHADA: '701000',
        image_url: '🍺',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-heineken',
        nom: 'Heineken 33cl',
        categorie: 'boisson',
        pole: 'bar',
        prix: 2000,
        prixAchat: 900,
        coutMatiere: 900,
        uniteParCasier: 24,
        stock_actuel: 48,
        stock_alerte: 12,
        compteOHADA: '701000',
        image_url: '🍾',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-vin-rouge',
        nom: 'Vin Rouge Baron de Lestac 75cl',
        categorie: 'boisson',
        pole: 'cave',
        prix: 10000,
        prixAchat: 4500,
        coutMatiere: 4500,
        stock_actuel: 18,
        stock_alerte: 6,
        compteOHADA: '701000',
        image_url: '🍷',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-eau-mayo',
        nom: 'Eau Minérale Mayo 1.5L',
        categorie: 'boisson',
        pole: 'bar',
        prix: 700,
        prixAchat: 300,
        coutMatiere: 300,
        stock_actuel: 60,
        stock_alerte: 12,
        compteOHADA: '701000',
        image_url: '💧',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-poulet-braise',
        nom: 'Poulet Braisé Entier + Alloco',
        categorie: 'nourriture',
        pole: 'cuisine',
        prix: 7500,
        coutMatiere: 2800, // Food cost = 37.3%
        foodCostPourcentage: 37.3,
        tempsPreparation: 25,
        stock_actuel: 40,
        stock_alerte: 5,
        compteOHADA: '706000',
        image_url: '🍗',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-poisson-braise',
        nom: 'Bar Braisé du Kouilou + Bananes',
        categorie: 'nourriture',
        pole: 'cuisine',
        prix: 9000,
        coutMatiere: 3200, // Food cost = 35.5%
        foodCostPourcentage: 35.5,
        tempsPreparation: 30,
        stock_actuel: 25,
        stock_alerte: 5,
        compteOHADA: '706000',
        image_url: '🐟',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-brochettes',
        nom: 'Brochettes de Bœuf (Portion de 5)',
        categorie: 'nourriture',
        pole: 'cuisine',
        prix: 3500,
        coutMatiere: 1100, // Food cost = 31.4%
        foodCostPourcentage: 31.4,
        tempsPreparation: 15,
        stock_actuel: 60,
        stock_alerte: 10,
        compteOHADA: '706000',
        image_url: '🍢',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      },
      {
        id: 'p-maboke',
        nom: 'Maboké de Poisson au Manioc',
        categorie: 'nourriture',
        pole: 'cuisine',
        prix: 6500,
        coutMatiere: 2200, // Food cost = 33.8%
        foodCostPourcentage: 33.8,
        tempsPreparation: 20,
        stock_actuel: 30,
        stock_alerte: 5,
        compteOHADA: '706000',
        image_url: '🍲',
        etablissement_id: ETABLISSEMENT_OFFICIEL_ID
      }
    ];

    for (const prod of produitsInitiaux) {
      await setDoc(doc(db, 'produits', prod.id), prod);
    }

    // 9. Initialiser quelques charges fixes du mois (SYSCOHADA 62/63)
    const chargesFixes = [
      { motif: 'Loyer Commercial Établissement (Centre-Ville)', montant: 350000, date: new Date().toISOString(), compteOHADA: '622000', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { motif: 'Facture Énergie SNE (Électricité Climatiseurs & Brasseurs)', montant: 120000, date: new Date().toISOString(), compteOHADA: '605100', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { motif: 'Abonnement Internet Fibre Optique & Télécoms', montant: 45000, date: new Date().toISOString(), compteOHADA: '628000', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
      { motif: 'Fournitures d\'entretien & hygiène bar/cuisine', montant: 35000, date: new Date().toISOString(), compteOHADA: '604000', etablissement_id: ETABLISSEMENT_OFFICIEL_ID },
    ];
    for (const ch of chargesFixes) {
      await addDoc(collection(db, 'charges_fixes'), ch);
    }

    // 10. Enregistrer l'audit log
    await enregistrerAuditLog({
      etablissement_id: ETABLISSEMENT_OFFICIEL_ID,
      auteur_id: 'securits-tech-superadmin',
      auteur_nom: 'Super Administrateur',
      auteur_role: 'super_admin',
      type_action: 'PURGE_BASE',
      niveau: 'critique',
      description: 'Réinitialisation complète et assainissement de la base. Établissement "Étoile du Congo" configuré.',
      details: { totalSupprimes }
    });

    return {
      succes: true,
      totalSupprimes,
      message: `Nettoyage terminé avec succès. ${totalSupprimes} documents purgés. Établissement officiel "ÉTOILE DU CONGO" re-créé avec succès.`
    };

  } catch (error: any) {
    console.error("Erreur réinitialisation plateforme:", error);
    return {
      succes: false,
      totalSupprimes,
      message: `Erreur lors du nettoyage: ${error.message}`
    };
  }
};
