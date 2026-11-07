import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface BusinessSession {
  id: string;
  etablissement_id: string;
  dateAffaire: string; // ISO string or YYYY-MM-DD
  ouvertLe: string;
  ouvertPar: string;
  statut: 'ouvert' | 'ferme';
  fermeLe?: string;
  fermePar?: string;
  caInitial?: number;
  caFinal?: number;
}

interface SessionState {
  sessionActuelle: BusinessSession | null;
  chargement: boolean;
  initialiserSession: (etablissementId: string) => void;
  ouvrirJournee: (etablissementId: string, date: string, adminId: string) => Promise<void>;
  fermerJournee: (sessionId: string, adminId: string, caFinal: number) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionActuelle: null,
  chargement: false,

  initialiserSession: (etablissementId) => {
    if (!etablissementId) return;
    set({ chargement: true });

    const q = query(
      collection(db, 'sessions_journalieres'),
      where('etablissement_id', '==', etablissementId),
      where('statut', '==', 'ouvert'),
      limit(1)
    );

    return onSnapshot(
      q, 
      (snap) => {
        if (!snap.empty) {
          set({ sessionActuelle: { id: snap.docs[0].id, ...snap.docs[0].data() } as BusinessSession, chargement: false });
        } else {
          set({ sessionActuelle: null, chargement: false });
        }
      },
      (err) => {
        console.warn("sessions_journalieres listener error:", err.message);
        set({ sessionActuelle: null, chargement: false });
      }
    );
  },

  ouvrirJournee: async (etablissementId, date, adminId) => {
    try {
      // Vérifier si une session est déjà ouverte
      const q = query(
        collection(db, 'sessions_journalieres'),
        where('etablissement_id', '==', etablissementId),
        where('statut', '==', 'ouvert')
      );
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error("Une session est déjà ouverte !");

      await addDoc(collection(db, 'sessions_journalieres'), {
        etablissement_id: etablissementId,
        dateAffaire: date,
        ouvertLe: new Date().toISOString(),
        ouvertPar: adminId,
        statut: 'ouvert',
        caInitial: 0
      });
      toast.success(`Journée du ${date} ouverte !`);
    } catch (error: any) {
      toast.error(error.message);
    }
  },

  fermerJournee: async (sessionId, adminId, caFinal) => {
    try {
      await updateDoc(doc(db, 'sessions_journalieres', sessionId), {
        statut: 'ferme',
        fermeLe: new Date().toISOString(),
        fermePar: adminId,
        caFinal
      });
      toast.success("Journée clôturée avec succès !");
    } catch (error: any) {
      toast.error("Erreur lors de la clôture");
    }
  }
}));
