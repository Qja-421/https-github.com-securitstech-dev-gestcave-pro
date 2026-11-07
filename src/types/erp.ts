export type StatutTable = 'libre' | 'occupee' | 'en_attente_paiement';

export interface Table {
  id: string;
  nom: string;
  capacite: number;
  statut: StatutTable;
  etablissement_id: string;
}

export interface Produit {
  id: string;
  nom: string;
  categorie: 'boisson' | 'nourriture' | 'autre';
  prix: number;
  stock_actuel: number;
  stock_alerte: number;
  image_url?: string;
  etablissement_id: string;
}

export interface LigneCommande {
  id: string;
  produit_id: string;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
  statut_preparation: 'en_attente' | 'en_preparation' | 'pret' | 'servi';
}

export interface SessionTable {
  id: string;
  table_id: string;
  serveur_id: string;
  date_ouverture: string;
  date_cloture?: string;
  statut: 'ouverte' | 'cloturee';
  total: number;
  etablissement_id: string;
  // Relation avec lignes pour le front-end
  lignes?: LigneCommande[];
}

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  role: 'serveur' | 'caissier' | 'cuisinier' | 'nettoyage' | 'manager';
  salaire_base: number;
  telephone: string;
  etablissement_id: string;
}

export interface Taxe {
  id: string;
  nom: string;
  organisme: string; // Ex: Mairie, Impôts
  montant: number;
  date_echeance: string;
  statut: 'a_payer' | 'payee' | 'en_retard';
  etablissement_id: string;
}
