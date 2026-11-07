import { db } from './firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const ETABLISSEMENT_ID = 'etoile-du-congo-id';

export const runScenarioSeed = async () => {
  const batch = writeBatch(db);

  // 1. Établissement
  const etabRef = doc(db, 'etablissements', ETABLISSEMENT_ID);
  batch.set(etabRef, {
    nom: 'BAR-RESTAURANT "ÉTOILE DU CONGO"',
    ville: 'Pointe-Noire',
    pays: 'Congo-Brazzaville',
    devise: 'FCFA',
    created_at: new Date().toISOString()
  });

  // 2. Personnel
  const personnel = [
    { id: 'admin-id', nom: 'ADMIN', prenom: 'Manager', role: 'admin', pin: '9071' },
    { id: 'serv01-id', nom: 'Jean-Baptiste', prenom: 'SERV01', role: 'serveur', pin: '1234' },
    { id: 'serv02-id', nom: 'Nadège', prenom: 'SERV02', role: 'serveur', pin: '2345' },
    { id: 'cuisto1-id', nom: 'Céleste', prenom: 'CUISTO1', role: 'cuisine', pin: '3456' },
    { id: 'caiss01-id', nom: 'Rodrigue', prenom: 'CAISS01', role: 'caissier', pin: '4567' }
  ];

  personnel.forEach(p => {
    const pRef = doc(db, 'employes', p.id);
    batch.set(pRef, {
      ...p,
      etablissement_id: ETABLISSEMENT_ID,
      actif: true
    });
  });

  // 3. Tables (T01 à T08)
  for (let i = 1; i <= 8; i++) {
    const tId = `table-t0${i}`;
    const tRef = doc(db, 'tables', tId);
    batch.set(tRef, {
      nom: `Table T0${i}`,
      capacite: 4,
      zone: 'salle',
      statut: 'libre',
      etablissement_id: ETABLISSEMENT_ID
    });
  }

  // 4. Stock Initial
  const boissons = [
    { nom: 'Primus 65cl', categorie: 'Boisson', prix: 1000, stockTotal: 10 * 24, unitesParCasier: 24, stockAlerte: 3 * 24, emoji: '🍺' },
    { nom: 'Ngok (eau) 1,5L', categorie: 'Boisson', prix: 500, stockTotal: 5 * 24, unitesParCasier: 24, stockAlerte: 10, emoji: '💧' },
    { nom: 'Coca-Cola 33cl', categorie: 'Boisson', prix: 600, stockTotal: 3 * 24, unitesParCasier: 24, stockAlerte: 10, emoji: '🥤' },
    { nom: 'Whisky JB 70cl', categorie: 'Boisson', prix: 10000, stockTotal: 12, unitesParCasier: 1, stockAlerte: 2, emoji: '🥃' },
    { nom: 'Vin rouge 75cl', categorie: 'Boisson', prix: 7000, stockTotal: 8, unitesParCasier: 1, stockAlerte: 2, emoji: '🍷' }
  ];

  const ingredients = [
    { nom: 'Poulet frais', categorie: 'Ingrédient', prix: 2500, stockTotal: 15, stockAlerte: 2, uniteMesure: 'kg', emoji: '🍗' },
    { nom: 'Poisson capitaine', categorie: 'Ingrédient', prix: 3500, stockTotal: 8, stockAlerte: 1, uniteMesure: 'kg', emoji: '🐟' },
    { nom: 'Riz local', categorie: 'Ingrédient', prix: 450, stockTotal: 25, stockAlerte: 5, uniteMesure: 'kg', emoji: '🍚' },
    { nom: 'Tomates fraîches', categorie: 'Ingrédient', prix: 800, stockTotal: 5, stockAlerte: 1, uniteMesure: 'kg', emoji: '🍅' },
    { nom: 'Huile de palme', categorie: 'Ingrédient', prix: 1200, stockTotal: 3, stockAlerte: 0.5, uniteMesure: 'L', emoji: '🛢️' },
    { nom: 'Oignons', categorie: 'Ingrédient', prix: 600, stockTotal: 4, stockAlerte: 0.8, uniteMesure: 'kg', emoji: '🧅' },
    { nom: 'Piment', categorie: 'Ingrédient', prix: 1500, stockTotal: 0.5, stockAlerte: 0.1, uniteMesure: 'kg', emoji: '🌶️' },
    { nom: 'Sel', categorie: 'Ingrédient', prix: 200, stockTotal: 2, stockAlerte: 0.4, uniteMesure: 'kg', emoji: '🧂' }
  ];

  [...boissons, ...ingredients].forEach((p, idx) => {
    const pRef = doc(db, 'produits', `prod-scenario-${idx}`);
    batch.set(pRef, {
      ...p,
      etablissement_id: ETABLISSEMENT_ID
    });
  });

  await batch.commit();
  console.log("Scenario seed completed!");
};
