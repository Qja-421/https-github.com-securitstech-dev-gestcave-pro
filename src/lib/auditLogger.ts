import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export interface AuditLogEntry {
  id?: string;
  etablissement_id: string;
  date: string;
  auteur_id: string;
  auteur_nom: string;
  auteur_role: string;
  type_action: 
    | 'CONNEXION'
    | 'REMISE_ACCORDEE'
    | 'ANNULATION_COMMANDE'
    | 'MODIFICATION_STOCK_MANUELLE'
    | 'MODIFICATION_PIN'
    | 'SUPPRESSION_EMPLOYE'
    | 'CLOTURE_CAISSE_ECART'
    | 'EXPORT_COMPTABLE'
    | 'PURGE_BASE';
  description: string;
  niveau: 'info' | 'avertissement' | 'critique';
  details?: Record<string, any>;
}

export const enregistrerAuditLog = async (log: Omit<AuditLogEntry, 'id' | 'date'>) => {
  try {
    const entry: AuditLogEntry = {
      ...log,
      date: new Date().toISOString()
    };
    await addDoc(collection(db, 'audit_logs'), entry);
  } catch (error) {
    console.warn("Impossible d'enregistrer le log d'audit dans Firestore:", error);
    // Sauvegarde de secours en localStorage pour audit local infalsifiable
    try {
      const existants = JSON.parse(localStorage.getItem('gestcave_audit_local') || '[]');
      existants.unshift({ ...log, date: new Date().toISOString(), id: `local-${Date.now()}` });
      localStorage.setItem('gestcave_audit_local', JSON.stringify(existants.slice(0, 100)));
    } catch (e) {
      // Ignorer
    }
  }
};

export const recupererAuditLogs = async (etablissementId: string): Promise<AuditLogEntry[]> => {
  try {
    const q = query(
      collection(db, 'audit_logs'),
      where('etablissement_id', '==', etablissementId),
      limit(100)
    );
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AuditLogEntry[];
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Si aucun log dans Firestore, combiner avec le local
    if (logs.length === 0) {
      const local = JSON.parse(localStorage.getItem('gestcave_audit_local') || '[]');
      return local.filter((l: any) => l.etablissement_id === etablissementId || !l.etablissement_id);
    }
    return logs;
  } catch (error) {
    console.warn("Erreur lecture audit_logs:", error);
    const local = JSON.parse(localStorage.getItem('gestcave_audit_local') || '[]');
    return local;
  }
};
