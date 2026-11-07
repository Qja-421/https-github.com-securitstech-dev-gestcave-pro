import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  increment 
} from 'firebase/firestore';

const ETABLISSEMENT_ID = 'etoile-du-congo-id';

export const runFullScenarioSimulation = async () => {
  const batch = writeBatch(db);
  const now = new Date();
  now.setFullYear(2025, 5, 17); // 17 Juin 2025
  
  const formatDate = (hours: number, minutes: number) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  try {
    // --- ÉTAPE 1 & 2 : OUVERTURE (07h30) ---
    const sessionRef = doc(collection(db, 'sessions_journalieres'));
    batch.set(sessionRef, {
      etablissement_id: ETABLISSEMENT_ID,
      dateAffaire: '2025-06-17',
      ouvertLe: formatDate(7, 30),
      ouvertPar: 'admin-id',
      statut: 'ouvert'
    });

    // --- ÉTAPE 3 : OUVERTURE TABLE T02 (11h00) ---
    const t02Ref = doc(db, 'tables', 'table-t02');
    const cmdT02Ref = doc(collection(db, 'commandes'));
    batch.set(cmdT02Ref, {
      id: cmdT02Ref.id,
      etablissement_id: ETABLISSEMENT_ID,
      tableId: 'table-t02',
      tableNom: 'Table T02',
      serveurId: 'serv01-id',
      serveurNom: 'Jean-Baptiste',
      dateOuverture: formatDate(11, 0),
      statut: 'servie', // Simuler direct servi pour simplifier
      lignes: [
        { id: 'l1', produitId: 'prod-scenario-0', produitNom: 'Primus 65cl', quantite: 3, prixUnitaire: 1000, sousTotal: 3000, statut: 'servi' },
        { id: 'l2', produitId: 'prod-scenario-5', produitNom: 'Poulet frais', quantite: 1, prixUnitaire: 2500, sousTotal: 2500, statut: 'servi', note: 'Portion 250g' },
        { id: 'l3', produitId: 'prod-scenario-7', produitNom: 'Riz local', quantite: 1, prixUnitaire: 1800, sousTotal: 1800, statut: 'servi', note: 'Sauce tomate' }
      ],
      total: 7300,
      nombreCouverts: 3,
      type: 'sur_place'
    });
    batch.update(t02Ref, { statut: 'occupee', commandeActiveId: cmdT02Ref.id });

    // Déduction stock Step 4
    batch.update(doc(db, 'produits', 'prod-scenario-0'), { stockTotal: increment(-3) });
    batch.update(doc(db, 'produits', 'prod-scenario-5'), { stockTotal: increment(-0.25) }); // Poulet 250g
    batch.update(doc(db, 'produits', 'prod-scenario-7'), { stockTotal: increment(-0.15) }); // Riz 150g
    batch.update(doc(db, 'produits', 'prod-scenario-8'), { stockTotal: increment(-0.10) }); // Tomates 100g
    batch.update(doc(db, 'produits', 'prod-scenario-10'), { stockTotal: increment(-0.05) }); // Oignons 50g

    // --- ÉTAPE 5 : DEUXIÈME TOURNÉE T02 (12h00) ---
    // On met à jour la commande existante
    batch.update(cmdT02Ref, {
      lignes: [
        { id: 'l1', produitId: 'prod-scenario-0', produitNom: 'Primus 65cl', quantite: 6, prixUnitaire: 1000, sousTotal: 6000, statut: 'servi' },
        { id: 'l2', produitId: 'prod-scenario-5', produitNom: 'Poulet frais', quantite: 1, prixUnitaire: 2500, sousTotal: 2500, statut: 'servi' },
        { id: 'l3', produitId: 'prod-scenario-7', produitNom: 'Riz local', quantite: 1, prixUnitaire: 1800, sousTotal: 1800, statut: 'servi' },
        { id: 'l4', produitId: 'prod-scenario-3', produitNom: 'Whisky JB 70cl', quantite: 1, prixUnitaire: 10000, sousTotal: 10000, statut: 'servi' }
      ],
      total: 20300
    });
    batch.update(doc(db, 'produits', 'prod-scenario-0'), { stockTotal: increment(-3) });
    batch.update(doc(db, 'produits', 'prod-scenario-3'), { stockTotal: increment(-1) });

    // --- ÉTAPE 6 : OUVERTURE TABLE T05 (11h45) ---
    const t05Ref = doc(db, 'tables', 'table-t05');
    const cmdT05Ref = doc(collection(db, 'commandes'));
    batch.set(cmdT05Ref, {
      id: cmdT05Ref.id,
      etablissement_id: ETABLISSEMENT_ID,
      tableId: 'table-t05',
      tableNom: 'Table T05',
      serveurId: 'serv02-id',
      serveurNom: 'Nadège',
      dateOuverture: formatDate(11, 45),
      statut: 'servie',
      lignes: [
        { id: 'l5', produitId: 'prod-scenario-2', produitNom: 'Coca-Cola 33cl', quantite: 2, prixUnitaire: 600, sousTotal: 1200, statut: 'servi' },
        { id: 'l6', produitId: 'prod-scenario-6', produitNom: 'Poisson capitaine', quantite: 1, prixUnitaire: 3500, sousTotal: 3500, statut: 'servi' },
        { id: 'l7', produitId: 'prod-scenario-1', produitNom: 'Ngok (eau) 1,5L', quantite: 1, prixUnitaire: 500, sousTotal: 500, statut: 'servi' }
      ],
      total: 5200,
      nombreCouverts: 2,
      type: 'sur_place'
    });
    batch.update(t05Ref, { statut: 'occupee', commandeActiveId: cmdT05Ref.id });
    batch.update(doc(db, 'produits', 'prod-scenario-2'), { stockTotal: increment(-2) });
    batch.update(doc(db, 'produits', 'prod-scenario-6'), { stockTotal: increment(-1) });
    batch.update(doc(db, 'produits', 'prod-scenario-1'), { stockTotal: increment(-1) });

    // --- ÉTAPE 7 : CLÔTURE T02 (13h30) ---
    batch.update(cmdT02Ref, { statut: 'payee', methodePaiement: 'especes', totalFinal: 20300, montantPaye: 20300, montantRestant: 0 });
    batch.update(t02Ref, { statut: 'libre', commandeActiveId: null });
    batch.set(doc(collection(db, 'transactions_pos')), {
      commandeId: cmdT02Ref.id, total: 20300, montantRecu: 20300, modePaiement: 'especes', date: formatDate(13, 30),
      etablissement_id: ETABLISSEMENT_ID, serveurNom: 'Jean-Baptiste'
    });

    // --- ÉTAPE 8 : CLÔTURE T05 (13h55) ---
    batch.update(cmdT05Ref, { statut: 'payee', methodePaiement: 'especes', totalFinal: 5200, montantPaye: 5200, montantRestant: 0 });
    batch.update(t05Ref, { statut: 'libre', commandeActiveId: null });
    batch.set(doc(collection(db, 'transactions_pos')), {
      commandeId: cmdT05Ref.id, total: 5200, montantRecu: 5200, modePaiement: 'especes', date: formatDate(13, 55),
      etablissement_id: ETABLISSEMENT_ID, serveurNom: 'Nadège'
    });

    // --- ÉTAPE 9 : RÉAPPROVISIONNEMENT (15h00) ---
    // 5 casiers Primus = 5 * 24 = 120 unités. Achat: 45000
    batch.update(doc(db, 'produits', 'prod-scenario-0'), { stockTotal: increment(120) });
    batch.set(doc(collection(db, 'transactions_pos')), {
      type: 'depense', description: 'Approvisionnement : 5 casiers Primus, 3kg Poulet, 2kg Poisson',
      total: 59500, date: formatDate(15, 0), etablissement_id: ETABLISSEMENT_ID
    });

    // --- ÉTAPE 10 : CLÔTURE JOURNÉE (23h00) ---
    batch.update(sessionRef, { statut: 'ferme', fermeLe: formatDate(23, 0), caFinal: 25500 });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Simulation error:", error);
    return false;
  }
};
