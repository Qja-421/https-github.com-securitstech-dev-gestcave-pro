import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  increment,
  writeBatch,
  getDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './authStore';
import { toast } from 'react-hot-toast';
import { invoicedAmount, outstandingAmount, receivedAmount } from '../lib/finance';

// Utilitaire pour l'impression thermique
export const imprimerTicket = (commande: Commande, etablissementNom: string) => {
  const totalFinal = Math.max(0, (commande.total || 0) - (commande.remise || 0));
  const montantPaye = Number(commande.montantPaye) || 0;
  const restant = Math.max(0, totalFinal - montantPaye);
  const estCredit = restant > 0 || commande.methodePaiement === 'credit';
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  const sectionPaiement = estCredit
    ? `
        <div class="total-section">
          ${commande.remise ? `<div>Remise: -${fmt(commande.remise)} F</div>` : ''}
          <div class="total">TOTAL: ${fmt(totalFinal)} FCFA</div>
          <div style="margin-top:4mm; padding:2mm 0; border-top:1px dashed black;">
            <div style="display:flex;justify-content:space-between;">
              <span>Versé :</span><span style="color:#16a34a;font-weight:bold;">${fmt(montantPaye)} F</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1mm;">
              <span>Reste dû :</span><span style="color:#dc2626;font-weight:bold;font-size:15px;">${fmt(restant)} F</span>
            </div>
            ${commande.clientNom ? `<div style="margin-top:2mm;font-size:10px;">Client : <strong>${commande.clientNom}</strong></div>` : ''}
            ${commande.clientContact ? `<div style="font-size:10px;">Contact : ${commande.clientContact}</div>` : ''}
            <div style="margin-top:2mm;font-size:9px;font-style:italic;color:#dc2626;">⚠ CRÉDIT — Solde à régulariser</div>
          </div>
        </div>`
    : `
        <div class="total-section">
          ${commande.remise ? `<div>Remise: -${fmt(commande.remise)} F</div>` : ''}
          <div class="total">TOTAL: ${fmt(totalFinal)} FCFA</div>
          <div style="margin-top:2mm;font-size:10px;color:#16a34a;font-weight:bold;">✓ PAYÉ INTÉGRALEMENT</div>
        </div>`;

  const contenu = `
    <html>
      <head>
        <title>Ticket ${commande.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; font-family: 'Courier New', Courier, monospace; 
            padding: 5mm; font-size: 12px; line-height: 1.2;
            color: black;
          }
          .header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed black; padding-bottom: 2mm; }
          .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .details { margin-bottom: 5mm; font-size: 10px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
          .table th { text-align: left; border-bottom: 1px solid black; padding-bottom: 1mm; }
          .item-row td { padding: 1mm 0; }
          .total-section { border-top: 2px solid black; padding-top: 2mm; text-align: right; }
          .total { font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 8mm; font-size: 10px; border-top: 1px dashed black; padding-top: 2mm; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${etablissementNom}</div>
          <div>Buvette & Cave</div>
        </div>
        
        <div class="details">
          <div>Ticket: ${commande.id.slice(-8).toUpperCase()}</div>
          <div>Table: ${commande.tableNom || 'EMPORTE'}</div>
          <div>Date: ${new Date(commande.dateOuverture).toLocaleString('fr-FR')}</div>
          <div>Serveur: ${commande.serveurNom}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th width="10%">Qté</th>
              <th width="60%">Article</th>
              <th width="30%" style="text-align: right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${commande.lignes.map(l => `
              <tr class="item-row">
                <td>${l.quantite}</td>
                <td>${l.produitNom}</td>
                <td style="text-align: right">${fmt(Number(l.sousTotal) || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${sectionPaiement}

        <div class="footer">
          Merci de votre visite !<br/>
          Propulsé par GESTCAVE PRO
        </div>

        <script>
          window.focus();
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;

  const fenetre = window.open('', '_blank', 'width=400,height=600');
  if (fenetre) {
    fenetre.document.write(contenu);
    fenetre.document.close();
  } else {
    toast.error("Veuillez autoriser les popups pour l'impression");
  }
};

export const imprimerBonPreparation = (commande: Commande, lignes: LigneCommande[], destinationLabel: string, etablissementNom: string) => {
  if (!lignes || lignes.length === 0) return;
  const contenu = `
    <html>
      <head>
        <title>BON - ${destinationLabel}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; font-family: 'Courier New', Courier, monospace; 
            padding: 5mm; font-size: 14px; line-height: 1.2;
            color: black;
          }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 2mm; margin-bottom: 5mm; }
          .title { font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .details { margin-bottom: 5mm; font-size: 12px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
          .table th { text-align: left; border-bottom: 1px solid black; padding-bottom: 1mm; font-size: 12px; }
          .item-row td { padding: 2mm 0; font-size: 14px; font-weight: bold; border-bottom: 1px dashed #ccc; }
          .no-print { display: none; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">BON ${destinationLabel}</div>
          <div style="font-size: 10px; margin-top: 2px;">${etablissementNom}</div>
        </div>
        
        <div class="details">
          <div><strong>Table: ${commande.tableNom || 'EMPORTE'}</strong></div>
          <div>Ticket: ${commande.id.slice(-8).toUpperCase()}</div>
          <div>Heure: ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>Serveur: ${commande.serveurNom}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th width="20%">Qté</th>
              <th width="80%">Article</th>
            </tr>
          </thead>
          <tbody>
            ${lignes.map(l => `
              <tr class="item-row">
                <td>${l.quantite}</td>
                <td>${l.produitNom}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 10mm; font-size: 10px;">
          --- FIN DU BON ---
        </div>

        <script>
          window.focus();
          window.print();
          window.onafterprint = () => window.close();
        </script>
      </body>
    </html>
  `;

  const fenetre = window.open('', '_blank', 'width=400,height=600');
  if (fenetre) {
    fenetre.document.write(contenu);
    fenetre.document.close();
  }
};

export interface LigneCommande {
  id: string;
  produitId: string;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
  statut: 'en_attente' | 'en_preparation' | 'pret' | 'servi';
  note?: string;
  heureEnvoi?: string;
  destination?: 'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha';
  produitCategorie?: string;
  datePreparationStart?: string;
  datePret?: string;
}

export interface Commande {
  id: string;
  etablissement_id: string;
  tableId: string | null;
  tableNom: string | null;
  serveurId: string;
  serveurNom: string;
  dateOuverture: string;
  statut: 'ouverte' | 'envoyee' | 'en_preparation' | 'servie' | 'payee' | 'en_attente_paiement' | 'en_arriere';
  lignes: LigneCommande[];
  total: number;
  nombreCouverts: number;
  type: 'sur_place' | 'a_emporter';
  methodePaiement?: 'comptant' | 'especes' | 'mobile' | 'carte' | 'credit';
  clientNom?: string;
  clientContact?: string;
  montantPaye?: number;
  montantRestant?: number;
  remise?: number;
  totalFinal?: number;
  datePromessePaiement?: string;
  dateMiseEnArriere?: string;
}

export interface TablePlan {
  id: string;
  nom: string;
  zone: 'salle' | 'terrasse' | 'vip' | 'comptoir';
  capacite: number;
  statut: 'libre' | 'occupee' | 'en_attente_paiement';
  commandeActiveId: string | null;
}

export interface Produit {
  id: string;
  nom: string;
  categorie: string;
  sousCategorie?: string;
  prix: number;
  stockTotal: number;
  stockAlerte?: number;
  unitesParCasier?: number;
  unite?: string;
  emoji?: string;
  destination_production?: 'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha';
  is_ingredient?: boolean;
  recette?: { ingredientId: string; quantite: number; nom?: string }[];
}

export interface SessionCaisse {
  id: string;
  etablissement_id: string;
  caissierId: string;
  caissierNom: string;
  dateOuverture: string;
  dateFermeture?: string;
  fondsInitial: number;
  fondsFinalSaisi?: number;
  totalVentesTheorique: number;
  totalFacture?: number;
  totalEncaisse?: number;
  totalEspeces?: number;
  totalMobile?: number;
  totalCarte?: number;
  totalCredit?: number;
  soldeTheorique?: number;
  ecartCaisse?: number;
  signatureCaissierId?: string;
  signatureCaissierNom?: string;
  dateSignature?: string;
  statut: 'ouverte' | 'fermee';
}

interface PosState {
  etablissement_id: string | null;
  tables: TablePlan[];
  produits: Produit[];
  commandes: Commande[];
  sessionActive: SessionCaisse | null;
  historiqueSessions: SessionCaisse[];
  loading: boolean;
  unsubs: (() => void)[];
  isOnline: boolean;

  initPOS: (etablissementId: string) => void;
  initialiserTempsReel: (etablissementId: string) => void;
  arreterTempsReel: () => void;
  
  refreshCommande: (id: string) => Promise<void>;
  ouvrirSession: (fondsInitial: number, caissierId?: string, caissierNom?: string) => Promise<void>;
  fermerSession: (fondsFinal: number) => Promise<void>;
  ouvrirTable: (tableId: string, serveurId: string, serveurNom: string, nombreCouverts: number) => Promise<string>;
  ouvrirVenteEmporter: (serveurId: string, serveurNom: string) => Promise<string>;
  ajouterLigne: (commandeId: string, produit: Produit, quantite?: number) => Promise<void>;
  modifierQuantite: (commandeId: string, ligneId: string, delta: number) => Promise<void>;
  supprimerLigne: (commandeId: string, ligneId: string) => Promise<void>;
  envoyerCuisine: (commandeId: string) => Promise<void>;
  marquerLignePrete: (commandeId: string, ligneId: string) => Promise<void>;
  marquerToutesLignesPretes: (commandeId: string, posteId: string) => Promise<void>;
  marquerLigneEnPreparation: (commandeId: string, ligneId: string) => Promise<void>;
  marquerToutesLignesEnPreparation: (commandeId: string, posteId: string) => Promise<void>;
  marquerCommandeServie: (commandeId: string, posteId?: string | null) => Promise<void>;
  encaisserCommande: (commandeId: string, modePaiement: 'comptant' | 'especes' | 'mobile' | 'carte' | 'credit', clientNom: string, montantRemise?: number, montantPaye?: number, clientContact?: string, refPaiement?: string) => Promise<void>;
  annulerCommande: (commandeId: string) => Promise<void>;
  demanderAddition: (commandeId: string, tableId: string) => Promise<void>;
  enregistrerAcompte: (commandeId: string, montant: number, mode: string) => Promise<void>;
  forcerLiberationTable: (tableId: string) => Promise<void>;
  mettreEnArriere: (commandeId: string, datePromesse?: string, clientNom?: string, clientContact?: string) => Promise<void>;
}

const DEFAULT_TABLES: TablePlan[] = [
  { id: 'table-t01', nom: 'Table T01', zone: 'salle', capacite: 4, statut: 'libre', commandeActiveId: null },
  { id: 'table-t02', nom: 'Table T02', zone: 'salle', capacite: 4, statut: 'occupee', commandeActiveId: 'cmd-demo-01' },
  { id: 'table-t03', nom: 'Table T03', zone: 'terrasse', capacite: 6, statut: 'libre', commandeActiveId: null },
  { id: 'table-t04', nom: 'Table T04', zone: 'terrasse', capacite: 4, statut: 'en_attente_paiement', commandeActiveId: 'cmd-demo-02' },
  { id: 'table-t05', nom: 'Table T05', zone: 'vip', capacite: 8, statut: 'libre', commandeActiveId: null },
  { id: 'table-t06', nom: 'Table T06', zone: 'vip', capacite: 6, statut: 'libre', commandeActiveId: null },
  { id: 'table-t07', nom: 'Table T07', zone: 'salle', capacite: 2, statut: 'libre', commandeActiveId: null },
  { id: 'table-comptoir', nom: 'Comptoir Bar', zone: 'comptoir', capacite: 10, statut: 'libre', commandeActiveId: null },
];

const DEFAULT_PRODUITS: Produit[] = [
  { id: 'p-primus', nom: 'Primus 65cl', categorie: 'Boisson', sousCategorie: 'Bière', prix: 1000, stockTotal: 180, stockAlerte: 24, unitesParCasier: 24, destination_production: 'bar', emoji: '🍺' },
  { id: 'p-ngok', nom: 'Ngok 65cl', categorie: 'Boisson', sousCategorie: 'Bière', prix: 1000, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, destination_production: 'bar', emoji: '🍺' },
  { id: 'p-heineken', nom: 'Heineken 33cl', categorie: 'Boisson', sousCategorie: 'Bière Import', prix: 1500, stockTotal: 72, stockAlerte: 12, unitesParCasier: 24, destination_production: 'bar', emoji: '🍻' },
  { id: 'p-coca', nom: 'Coca-Cola 33cl', categorie: 'Boisson', sousCategorie: 'Soft', prix: 600, stockTotal: 96, stockAlerte: 20, unitesParCasier: 24, destination_production: 'bar', emoji: '🥤' },
  { id: 'p-whisky-jb', nom: 'Whisky J&B 70cl', categorie: 'Boisson', sousCategorie: 'Spiritueux', prix: 12000, stockTotal: 14, stockAlerte: 3, destination_production: 'bar', emoji: '🥃' },
  { id: 'p-vin-bordeaux', nom: 'Bordeaux Rouge 75cl', categorie: 'Boisson', sousCategorie: 'Vin', prix: 7500, stockTotal: 22, stockAlerte: 5, destination_production: 'bar', emoji: '🍷' },
  { id: 'p-poulet-braise', nom: 'Poulet Braisé Entier', categorie: 'Plat', sousCategorie: 'Grillade', prix: 5500, stockTotal: 25, stockAlerte: 5, destination_production: 'cuisine', emoji: '🍗' },
  { id: 'p-brochettes', nom: 'Brochettes Bœuf (x5)', categorie: 'Plat', sousCategorie: 'Grillade', prix: 3000, stockTotal: 40, stockAlerte: 10, destination_production: 'cuisine', emoji: '🍢' },
  { id: 'p-frites', nom: 'Portion de Frites / Bananes', categorie: 'Accompagnement', sousCategorie: 'Accompagnement', prix: 1000, stockTotal: 50, stockAlerte: 10, destination_production: 'cuisine', emoji: '🍟' },
];

const DEFAULT_COMMANDES: Commande[] = [
  {
    id: 'cmd-demo-01',
    etablissement_id: 'etoile-du-congo-id',
    tableId: 'table-t02',
    tableNom: 'Table T02',
    serveurId: 'serv01-id',
    serveurNom: 'Jean-Baptiste (Serveur)',
    dateOuverture: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    statut: 'en_preparation',
    nombreCouverts: 3,
    type: 'sur_place',
    total: 9500,
    lignes: [
      { id: 'l-01', produitId: 'p-primus', produitNom: 'Primus 65cl', quantite: 3, prixUnitaire: 1000, sousTotal: 3000, statut: 'pret', destination: 'bar' },
      { id: 'l-02', produitId: 'p-poulet-braise', produitNom: 'Poulet Braisé Entier', quantite: 1, prixUnitaire: 5500, sousTotal: 5500, statut: 'en_preparation', destination: 'cuisine', datePreparationStart: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
      { id: 'l-03', produitId: 'p-frites', produitNom: 'Portion de Frites / Bananes', quantite: 1, prixUnitaire: 1000, sousTotal: 1000, statut: 'en_attente', destination: 'cuisine' }
    ]
  },
  {
    id: 'cmd-demo-02',
    etablissement_id: 'etoile-du-congo-id',
    tableId: 'table-t04',
    tableNom: 'Table T04',
    serveurId: 'serv02-id',
    serveurNom: 'Nadège (Serveuse)',
    dateOuverture: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    statut: 'en_attente_paiement',
    nombreCouverts: 4,
    type: 'sur_place',
    total: 13500,
    clientNom: 'M. Makosso',
    lignes: [
      { id: 'l-10', produitId: 'p-vin-bordeaux', produitNom: 'Bordeaux Rouge 75cl', quantite: 1, prixUnitaire: 7500, sousTotal: 7500, statut: 'servi', destination: 'bar' },
      { id: 'l-11', produitId: 'p-brochettes', produitNom: 'Brochettes Bœuf (x5)', quantite: 2, prixUnitaire: 3000, sousTotal: 6000, statut: 'servi', destination: 'cuisine' }
    ]
  }
];

const DEFAULT_SESSION: SessionCaisse = {
  id: 'sess-demo-01',
  etablissement_id: 'etoile-du-congo-id',
  caissierId: 'caiss01-id',
  caissierNom: 'Rodrigue (Caisse)',
  dateOuverture: new Date().toISOString(),
  fondsInitial: 50000,
  totalVentesTheorique: 185000,
  totalEncaisse: 165000,
  totalEspeces: 95000,
  totalMobile: 70000,
  totalCredit: 20000,
  statut: 'ouverte'
};

export const usePOSStore = create<PosState>((set, get) => ({
  etablissement_id: 'etoile-du-congo-id',
  tables: DEFAULT_TABLES,
  produits: DEFAULT_PRODUITS,
  commandes: DEFAULT_COMMANDES,
  sessionActive: DEFAULT_SESSION,
  historiqueSessions: [],
  loading: false,
  isOnline: true,
  unsubs: [],

  initPOS: (etablissementId) => {
    if (!etablissementId) return;
    get().arreterTempsReel();
    set({ loading: true, etablissement_id: etablissementId });
    
    const unsubs = [];

    // CONNECTION STATUS (Correction: Firestore n'a pas de .info/connected)
    const updateOnlineStatus = () => set({ isOnline: window.navigator.onLine });
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    unsubs.push(() => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    });

    // TABLES
    unsubs.push(onSnapshot(
      query(collection(db, 'tables'), where('etablissement_id', '==', etablissementId)), 
      (snap) => {
        const tablesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TablePlan[];
        set({ tables: tablesData.length > 0 ? tablesData : DEFAULT_TABLES });
      },
      (error) => {
        console.warn("Mode Démo/Offline tables actif:", error);
        set({ tables: DEFAULT_TABLES });
      }
    ));

    // PRODUITS
    unsubs.push(onSnapshot(
      query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId)), 
      (snap) => {
        const produitsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Produit[];
        set({ produits: produitsData.length > 0 ? produitsData : DEFAULT_PRODUITS });
      },
      (error) => {
        console.warn("Mode Démo/Offline produits actif:", error);
        set({ produits: DEFAULT_PRODUITS });
      }
    ));

    // SESSIONS
    unsubs.push(onSnapshot(
      query(collection(db, 'sessions_caisse'), where('etablissement_id', '==', etablissementId), where('statut', '==', 'ouverte')), 
      (snap) => {
        if (!snap.empty) {
          set({ sessionActive: { id: snap.docs[0].id, ...snap.docs[0].data() } as SessionCaisse });
        } else {
          set({ sessionActive: null });
        }
      },
      (error) => {
        console.error("Erreur session caisse:", error);
      }
    ));

    unsubs.push(onSnapshot(
      query(collection(db, 'sessions_caisse'), where('etablissement_id', '==', etablissementId), where('statut', '==', 'fermee')), 
      (snap) => {
        set({ historiqueSessions: snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionCaisse)) });
      },
      (error) => {
        console.error("Erreur historique sessions:", error);
      }
    ));

    // COMMANDES
    const handleCommandes = (snap: any) => {
      const newItems = snap.docs.map((d:any) => ({ id: d.id, ...d.data() } as Commande));
      set(state => {
          // On fusionne les nouvelles données avec les existantes
          const current = [...state.commandes];
          newItems.forEach((item: Commande) => {
              const idx = current.findIndex(c => c.id === item.id);
              if (idx > -1) current[idx] = item;
              else current.push(item);
          });
          // On filtre en JS pour ne garder que les commandes actives
          return { commandes: current.filter(c => c.statut !== 'payee') };
      });
    };

    unsubs.push(onSnapshot(
      query(collection(db, 'commandes'), where('etablissement_id', '==', etablissementId)), 
      handleCommandes,
      (error) => {
        console.warn("commandes sync notice (mode démo/offline):", error.message);
      }
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'commandes'), where('etablissementId', '==', etablissementId)), 
      handleCommandes,
      (error) => {
        console.warn("commandes fallback sync notice:", error.message);
      }
    ));

    // Sécurité : Timeout si Firestore est trop lent (mode offline ou instable)
    setTimeout(() => {
        if (get().loading) {
            console.warn("initPOS: Timeout atteint, forçage de loading: false");
            set({ loading: false });
        }
    }, 8000);

    set({ loading: false, unsubs });
  },

  initialiserTempsReel: (etablissementId) => get().initPOS(etablissementId),
  
  arreterTempsReel: () => {
    get().unsubs.forEach(u => u());
    set({ unsubs: [] });
  },

  refreshCommande: async (id) => {
      const snap = await getDoc(doc(db, 'commandes', id));
      if (snap.exists()) {
          const cmd = { id: snap.id, ...snap.data() } as Commande;
          set(s => {
              // Si la commande est payée, on la retire de l'état local (KDS/Caisse active)
              if (cmd.statut === 'payee') {
                  return { commandes: s.commandes.filter(c => c.id !== id) };
              }
              const exists = s.commandes.some(c => c.id === id);
              if (exists) {
                  return { commandes: s.commandes.map(c => c.id === id ? cmd : c) };
              } else {
                  return { commandes: [...s.commandes, cmd] };
              }
          });
      }
  },

  ouvrirSession: async (fondsInitial, caissierId?: string, caissierNom?: string) => {
    const etabId = get().etablissement_id || useAuthStore.getState().etablissementSimuleId;
    if (!etabId) throw new Error("Etablissement introuvable pour ouvrir la caisse");
    if (get().sessionActive) throw new Error("Une session de caisse est deja ouverte");

    const derniereSession = [...get().historiqueSessions]
      .filter(s => s.statut === 'fermee')
      .sort((a, b) => new Date(b.dateFermeture || 0).getTime() - new Date(a.dateFermeture || 0).getTime())[0];
    const fondsInitialReel = derniereSession?.fondsFinalSaisi ?? Number(fondsInitial);

    const cid = caissierId || sessionStorage.getItem('poste_employe_id') || useAuthStore.getState().profil?.id || 'unknown';
    const cnom = caissierNom || sessionStorage.getItem('poste_employe_nom') || useAuthStore.getState().profil?.nom || 'Caissier';
    
    const session = {
      etablissement_id: etabId,
      caissierId: cid,
      caissierNom: cnom,
      dateOuverture: new Date().toISOString(),
      fondsInitial: Number(fondsInitialReel) || 0,
      totalVentesTheorique: 0,
      totalFacture: 0,
      totalEncaisse: 0,
      totalEspeces: 0,
      totalMobile: 0,
      totalCarte: 0,
      totalCredit: 0,
      statut: 'ouverte' as const
    };
    await addDoc(collection(db, 'sessions_caisse'), session);
    toast.success("Session de caisse ouverte !");
  },

  fermerSession: async (fondsFinal) => {
    const session = get().sessionActive;
    if (!session) return;
    
    const toastId = toast.loading("Calcul des totaux et clôture...");
    
    try {
      const q = query(
        collection(db, 'transactions_pos'), 
        where('etablissement_id', '==', session.etablissement_id),
        where('date', '>=', session.dateOuverture)
      );
      
      const snap = await getDocs(q);
      let totalE = 0, totalM = 0, totalC = 0, totalCred = 0, totalFacture = 0;
      
      snap.docs.forEach((d) => {
        const t = d.data();
        if (t.type === 'depense') return;
        const encaisse = receivedAmount(t);
        totalFacture += invoicedAmount(t);
        if (t.modePaiement === 'especes' || t.modePaiement === 'comptant') totalE += encaisse;
        else if (t.modePaiement === 'mobile') totalM += encaisse;
        else if (t.modePaiement === 'carte') totalC += encaisse;
        totalCred += outstandingAmount(t);
      });

      const totalEncaisse = totalE + totalM + totalC;
      const soldeTheorique = (Number(session.fondsInitial) || 0) + totalE;
      const ecartCaisse = Number(fondsFinal) - soldeTheorique;

      await updateDoc(doc(db, 'sessions_caisse', session.id), {
        statut: 'fermee',
        dateFermeture: new Date().toISOString(),
        fondsFinalSaisi: Number(fondsFinal),
        totalVentesTheorique: totalFacture,
        totalFacture,
        totalEncaisse,
        totalEspeces: totalE,
        totalMobile: totalM,
        totalCarte: totalC,
        totalCredit: totalCred,
        soldeTheorique,
        ecartCaisse,
        signatureCaissierId: session.caissierId,
        signatureCaissierNom: session.caissierNom,
        dateSignature: new Date().toISOString()
      });

      toast.success("Caisse clôturée avec succès !", { id: toastId });
      set({ sessionActive: null });
    } catch (err: any) {
      toast.error("Erreur lors de la clôture", { id: toastId });
      console.error(err);
    }
  },

  ouvrirTable: async (tableId, serveurId, serveurNom, nombreCouverts) => {
    const etabId = get().etablissement_id;
    const table = get().tables.find(t => t.id === tableId);
    if (!table) throw new Error('Table introuvable');

    const nouvCmd = {
      etablissement_id: etabId || '',
      etablissementId: etabId || '', // Double champ pour sécurité
      tableId, tableNom: table.nom, serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: Number(nombreCouverts), type: 'sur_place'
    };

    const docRef = await addDoc(collection(db, 'commandes'), nouvCmd);
    await updateDoc(doc(db, 'tables', tableId), { 
      statut: 'occupee', 
      commandeActiveId: docRef.id,
      serveurNom: serveurNom 
    });
    return docRef.id;
  },

  ouvrirVenteEmporter: async (serveurId, serveurNom) => {
    const etabId = get().etablissement_id;
    const nouvCmd = {
      etablissement_id: etabId || '',
      etablissementId: etabId || '',
      tableId: null, tableNom: 'A EMPORTER', serveurId, serveurNom,
      dateOuverture: new Date().toISOString(), statut: 'ouverte',
      lignes: [], total: 0, nombreCouverts: 1, type: 'a_emporter'
    };
    const docRef = await addDoc(collection(db, 'commandes'), nouvCmd);
    return docRef.id;
  },

  ajouterLigne: async (commandeId, produit, quantite = 1) => {
    if (!commandeId || !produit) return;
    const toastId = toast.loading(`Enregistrement de ${produit.nom}...`);

    try {
      const commandeRef = doc(db, 'commandes', commandeId);
      const snap = await getDoc(commandeRef);
      if (!snap.exists()) throw new Error("Commande introuvable en base");

      const data = snap.data();
      const lignesActuelles = (data.lignes || []) as LigneCommande[];
      
      // Détection robuste des boissons pour routage KDS (Cuisine vs Bar)
      const catNorm = (produit.categorie || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const motsBoissons = [
        'boisson', 'biere', 'vin', 'jus', 'champagne', 'liqueur', 'soda', 'eau', 
        'alcool', 'spiritueux', 'aperitif', 'cocktail', 'sucrerie', 'rafraichissement',
        'canette', 'bouteille', 'whisky', 'rhum', 'vodka', 'gin', 'pastis', 'sirop'
      ];
      const isBoisson = motsBoissons.some(mot => catNorm.includes(mot));
      
      // On cherche si une ligne identique (même produit ET même statut en attente) existe déjà
      const idx = lignesActuelles.findIndex(l => l.produitId === produit.id && l.statut === 'en_attente');
      let nvellesLignes = [...lignesActuelles];
      
      if (idx > -1) {
        const item = nvellesLignes[idx];
        const nveleQte = (Number(item.quantite) || 0) + quantite;
        nvellesLignes[idx] = { ...item, quantite: nveleQte, sousTotal: nveleQte * Number(produit.prix) };
      } else {
        nvellesLignes.push({
          id: Math.random().toString(36).substr(2, 9),
          produitId: produit.id, produitNom: produit.nom,
          quantite: quantite, prixUnitaire: Number(produit.prix),
          sousTotal: quantite * Number(produit.prix), statut: 'en_attente',
          destination: produit.destination_production || (isBoisson ? 'bar' : 'cuisine'),
          produitCategorie: produit.categorie
        });
      }

      const nouveauTotal = nvellesLignes.reduce((sum, l) => sum + (Number(l.sousTotal) || 0), 0);
      await updateDoc(commandeRef, { lignes: nvellesLignes, total: nouveauTotal });
      
      // FORCE REFRESH AVEC AJOUT SI MANQUANT
      await get().refreshCommande(commandeId);

      toast.success(`${produit.nom} ajouté !`, { id: toastId });
    } catch (err: any) {
      console.error("ERREUR POS:", err);
      toast.error("Erreur: " + err.message, { id: toastId });
    }
  },

  modifierQuantite: async (commandeId, ligneId, delta) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const nvele = (data.lignes || []).map((l:any) => {
        if (l.id === ligneId) {
            const q = Math.max(1, l.quantite + delta);
            return { ...l, quantite: q, sousTotal: q * l.prixUnitaire };
        }
        return l;
    });
    const total = nvele.reduce((s:any, i:any) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes: nvele, total });
    await get().refreshCommande(commandeId);
  },

  supprimerLigne: async (commandeId, ligneId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const lignes = ((snap.data().lignes || []) as LigneCommande[]).filter(l => l.id !== ligneId);
    const total = lignes.reduce((s, i) => s + i.sousTotal, 0);
    await updateDoc(commandeRef, { lignes, total });
    await get().refreshCommande(commandeId);
  },

  envoyerCuisine: async (commandeId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const lignes = (data.lignes || []) as LigneCommande[];
    const batch = writeBatch(db);
    const mtn = new Date().toISOString();
    const etablissementId = get().etablissement_id || data.etablissement_id || data.etablissementId || '';
    
    lignes.forEach(l => {
        if (l.statut === 'en_attente') {
            const produit = get().produits.find(p => p.id === l.produitId);
            if (produit?.recette && produit.recette.length > 0) {
              // Décrémenter les ingrédients
              produit.recette.forEach(ing => {
                const qteTotale = ing.quantite * l.quantite;
                batch.update(doc(db, 'produits', ing.ingredientId), { stockTotal: increment(-qteTotale) });
                
                // Historique pour l'ingrédient
                batch.set(doc(collection(db, 'historique_stocks')), {
                  produitId: ing.ingredientId,
                  produitNom: ing.nom || 'Ingrédient',
                  type: 'sortie_vente',
                  quantite: qteTotale,
                  date: mtn,
                  etablissement_id: etablissementId,
                  commandeId: commandeId,
                  note: `Consommation recette: ${produit.nom} (x${l.quantite})`
                });
              });
            } else {
              // Comportement standard
              batch.update(doc(db, 'produits', l.produitId), { stockTotal: increment(-l.quantite) });
              
              // Historique pour le produit
              batch.set(doc(collection(db, 'historique_stocks')), {
                produitId: l.produitId,
                produitNom: l.produitNom,
                type: 'sortie_vente',
                quantite: l.quantite,
                date: mtn,
                etablissement_id: etablissementId,
                commandeId: commandeId,
                note: `Vente directe`
              });
            }
        }
    });

    // On change le statut des lignes pour éviter la double déduction au prochain envoi
    const nvele = lignes.map(l => l.statut === 'en_attente' ? { ...l, statut: 'en_preparation' as const, heureEnvoi: mtn } : l);
    batch.update(commandeRef, { statut: 'envoyee', lignes: nvele });
    
    await batch.commit();
    await get().refreshCommande(commandeId);
    toast.success("Tournée envoyée en production !");
  },

  marquerLigneEnPreparation: async (commandeId, ligneId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cmd = { id: snap.id, ...snap.data() } as Commande;
    const nvelles = cmd.lignes.map(l => 
          l.id === ligneId ? { ...l, statut: 'en_preparation' as const, datePreparationStart: new Date().toISOString() } : l
        );
    await updateDoc(ref, { lignes: nvelles });
    await get().refreshCommande(commandeId);
  },

  marquerLignePrete: async (commandeId, ligneId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cmd = { id: snap.id, ...snap.data() } as Commande;
    const nvelles = cmd.lignes.map(l => 
          l.id === ligneId ? { ...l, statut: 'pret' as const, datePret: new Date().toISOString() } : l
        );
    await updateDoc(ref, { lignes: nvelles });
    await get().refreshCommande(commandeId);
  },
  
  marquerToutesLignesPretes: async (commandeId, posteId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const nvelles = (snap.data().lignes || []).map((l:any) => 
        (posteId === 'tous' || l.destination === posteId) && l.statut !== 'servi' ? {...l, statut: 'pret', datePret: new Date().toISOString()} : l
    );
    await updateDoc(ref, { lignes: nvelles });
    await get().refreshCommande(commandeId);
  },

  marquerToutesLignesEnPreparation: async (commandeId, posteId) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const cmd = { id: snap.id, ...snap.data() } as Commande;
    const nvelles = cmd.lignes.map(l => 
          (posteId === 'tous' || l.destination === posteId) && l.statut === 'en_attente'
            ? { ...l, statut: 'en_preparation' as const, datePreparationStart: new Date().toISOString() }
            : l
        );
    await updateDoc(ref, { lignes: nvelles });
    await get().refreshCommande(commandeId);
  },

  marquerCommandeServie: async (commandeId, destination?: string | null) => {
    const ref = doc(db, 'commandes', commandeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const lignes = (data.lignes || []) as LigneCommande[];
    
    // On ne marque comme servi que les lignes de la station (ou toutes si pas de station)
    const nvelles = lignes.map((l: any) => {
      if (!destination || l.destination === destination) {
        return { ...l, statut: 'servi' };
      }
      return l;
    });

    // La commande n'est "servie" globalement que si TOUTES les lignes sont servies
    const toutesServies = nvelles.every((l: any) => l.statut === 'servi');
    
    await updateDoc(ref, { 
      statut: toutesServies ? 'servie' : data.statut, 
      lignes: nvelles 
    });

    // NOTIFICATION AU SERVEUR (Dès qu'une partie est prête)
    const stationPrete = destination?.toUpperCase() || 'CUISINE';
    await addDoc(collection(db, 'notifications_postes'), {
      etablissement_id: data.etablissement_id,
      serveurId: data.serveurId,
      commandeId: commandeId,
      tableNom: data.tableNom || 'Emporter',
      type: 'pret_pour_service',
      message: `[${stationPrete}] La commande pour la table ${data.tableNom || 'Emporter'} est prête !`,
      date: new Date().toISOString(),
      statut: 'non_lu'
    });

    await get().refreshCommande(commandeId);
  },

  encaisserCommande: async (commandeId, mode, client, remise = 0, paye = 0, contact = '', refPaiement = '') => {
    const batch = writeBatch(db);
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    const cmd = { id: snap.id, ...snap.data() } as Commande;
    
    // Marquer automatiquement toutes les lignes comme servies lors de l'encaissement
    // pour nettoyer le KDS
    const nvellesLignes = (cmd.lignes || []).map(l => ({ ...l, statut: 'servi' as const }));
    
    const totalFinal = Math.max(0, cmd.total - (remise || 0));
    const montantDejaTrace = Number(cmd.montantPaye) || 0;
    // FIX: Si c'est un crédit total, on a reçu 0. Sinon, si paye est vide, c'est le montant exact
    const montantPayeTotal = (mode === 'credit' && !paye) ? 0 : (paye || totalFinal);
    const montantEncaisseTransaction = Math.max(0, montantPayeTotal - montantDejaTrace);
    const restant = Math.max(0, totalFinal - montantPayeTotal);
    const nouveauStatut = restant > 0 ? 'en_arriere' : 'payee';

    batch.update(commandeRef, { 
      statut: nouveauStatut, 
      lignes: nvellesLignes,
      methodePaiement: mode, 
      clientNom: client || null, 
      clientContact: contact || null,
      montantPaye: montantPayeTotal, 
      montantRestant: restant, 
      remise: remise || 0, 
      totalFinal,
      ...(restant > 0 ? { dateMiseEnArriere: new Date().toISOString() } : {})
    });

    if (cmd.tableId) {
      batch.update(doc(db, 'tables', cmd.tableId), { 
        statut: 'libre', 
        commandeActiveId: null,
        serveurNom: null
      });
    }

    const session = get().sessionActive;

    batch.set(doc(collection(db, 'transactions_pos')), {
      commandeId,
      modePaiement: mode, 
      date: new Date().toISOString(),
      montant: montantEncaisseTransaction,
      totalVente: totalFinal, // Total de la note pour historique
      montantRestant: restant,
      datePromessePaiement: cmd.datePromessePaiement || null,
      clientNom: client || 'Direct', 
      clientContact: contact || '',
      etablissement_id: get().etablissement_id || cmd.etablissement_id || '',
      sessionId: session?.id || null,
      serveurId: cmd.serveurId,
      serveurNom: cmd.serveurNom,
      refPaiement: refPaiement || null,
      type: 'final'
    });

    if (session) {
      const modeAmount = montantEncaisseTransaction;
      const creditAmount = restant;
      const m = mode as string;
      batch.update(doc(db, 'sessions_caisse', session.id), {
        totalVentesTheorique: increment(totalFinal),
        totalFacture: increment(totalFinal),
        totalEncaisse: increment(modeAmount),
        ...(m === 'mobile' ? { totalMobile: increment(modeAmount) } : {}),
        ...(m === 'especes' || m === 'comptant' ? { totalEspeces: increment(modeAmount) } : {}),
        ...(m === 'carte' ? { totalCarte: increment(modeAmount) } : {}),
        ...(creditAmount > 0 ? { totalCredit: increment(creditAmount) } : {})
      });
    }

    await batch.commit();
    await get().refreshCommande(commandeId);
  },

  annulerCommande: async (commandeId) => {
    if (!commandeId) return;
    const commandeRef = doc(db, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const batch = writeBatch(db);
    
    // Libération de la table
    if (data.tableId) {
        batch.update(doc(db, 'tables', data.tableId), { 
          statut: 'libre', 
          commandeActiveId: null,
          serveurNom: null
        });
    }
    
    // Restitution des stocks pour les lignes validées
    const lignes = (data.lignes || []) as LigneCommande[];
    lignes.forEach(l => {
        if (l.statut !== 'en_attente') {
            batch.update(doc(db, 'produits', l.produitId), { stockTotal: increment(l.quantite) });
        }
    });

    // Suppression définitive pour éviter de laisser une commande fantôme
    batch.delete(commandeRef);
    await batch.commit();
    
    // Nettoyage de l'état local
    set(state => ({ commandes: state.commandes.filter(c => c.id !== commandeId) }));
  },

  demanderAddition: async (commandeId, tableId) => {
    if (!tableId || !commandeId) return;
    const batch = writeBatch(db);
    batch.update(doc(db, 'tables', tableId), { statut: 'en_attente_paiement' });
    await batch.commit();
    toast.success("Demande d'addition envoyée à la caisse !");
  },

  enregistrerAcompte: async (commandeId, montant, mode) => {
    const cmd = get().commandes.find(c => c.id === commandeId);
    if (!cmd) return;

    const nouveauMontantPaye = (cmd.montantPaye || 0) + montant;
    const nouveauMontantRestant = (cmd.total || 0) - nouveauMontantPaye;

    const batch = writeBatch(db);
    batch.update(doc(db, 'commandes', commandeId), { 
      montantPaye: nouveauMontantPaye,
      montantRestant: nouveauMontantRestant
    });

    // Enregistrement de l'acompte comme transaction
    const transaction = {
      commandeId,
      etablissement_id: cmd.etablissement_id,
      montant: montant, // L'argent encaissé MAINTENANT
      totalVente: cmd.total,
      date: new Date().toISOString(),
      modePaiement: mode,
      type: 'acompte',
      sessionId: get().sessionActive?.id || null,
      serveurNom: cmd.serveurNom
    };
    
    batch.set(doc(collection(db, 'transactions_pos')), transaction);

    const session = get().sessionActive;
    if (session) {
      batch.update(doc(db, 'sessions_caisse', session.id), {
        totalEncaisse: increment(montant),
        ...(mode === 'mobile' ? { totalMobile: increment(montant) } : {}),
        ...(mode === 'especes' || mode === 'comptant' ? { totalEspeces: increment(montant) } : {}),
        ...(mode === 'carte' ? { totalCarte: increment(montant) } : {}),
        ...(mode === 'credit' ? { totalCredit: increment(montant) } : {})
      });
    }

    await batch.commit();
    await get().refreshCommande(commandeId);
  },

  mettreEnArriere: async (commandeId, datePromesse?, clientNom?, clientContact?) => {
    const cmd = get().commandes.find(c => c.id === commandeId);
    if (!cmd) return;

    const batch = writeBatch(db);
    const commandeRef = doc(db, 'commandes', commandeId);

    // On marque la commande comme étant en arriéré avec infos débiteur
    batch.update(commandeRef, { 
      statut: 'en_arriere',
      dateMiseEnArriere: new Date().toISOString(),
      ...(datePromesse ? { datePromessePaiement: datePromesse } : {}),
      ...(clientNom ? { clientNom } : {}),
      ...(clientContact ? { clientContact } : {}),
      montantRestant: (cmd.total || 0) - (cmd.montantPaye || 0)
    });

    // On libère la table pour d'autres clients
    if (cmd.tableId) {
      batch.update(doc(db, 'tables', cmd.tableId), { 
        statut: 'libre', 
        commandeActiveId: null,
        serveurNom: null
      });
    }

    await batch.commit();
    await get().refreshCommande(commandeId);
    toast.success("Commande mise en arriéré. La table est libérée.");
  },

  forcerLiberationTable: async (tableId) => {
    await updateDoc(doc(db, 'tables', tableId), { 
      statut: 'libre', 
      commandeActiveId: null,
      serveurNom: null
    });
  }
}));

