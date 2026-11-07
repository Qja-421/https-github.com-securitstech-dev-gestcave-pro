import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';

export const usePosteSession = () => {
  const { initialiserTempsReel, tables, etablissement_id: posEtabId } = usePOSStore();
  const { profil } = useAuthStore();
  const navigate = useNavigate();

  // Infos employé depuis sessionStorage (mode poste)
  const idEmploye = sessionStorage.getItem('poste_employe_id')
    || profil?.id
    || 'demo-employe-id';

  const nomEmploye = sessionStorage.getItem('poste_employe_nom')
    || profil?.nom
    || profil?.prenom
    || 'Collaborateur GestCave';

  const roleEmploye = sessionStorage.getItem('poste_employe_role')
    || profil?.role
    || 'serveur';

  const etablissementId = sessionStorage.getItem('poste_etablissement_id')
    || profil?.etablissement_id
    || useAuthStore.getState().etablissementSimuleId
    || localStorage.getItem('gestcave_sim_etab_id')
    || 'etoile-du-congo-id';

  // Si le store n'a pas de données (ex: refresh de page) — on réinitialise
  useEffect(() => {
    if (etablissementId && !posEtabId) {
      initialiserTempsReel(etablissementId);
    }
  }, [etablissementId, posEtabId, initialiserTempsReel]);

  const quitterPoste = async () => {
    const sessionId = sessionStorage.getItem('poste_session_travail_id');
    const etabId = sessionStorage.getItem('poste_etablissement_id');

    // POINTAGE : Enregistrement de la fin de service
    if (sessionId) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await updateDoc(doc(db, 'sessions_travail', sessionId), {
          fin: new Date().toISOString(),
          statut: 'termine'
        });
      } catch (e) {
        console.error("Erreur clôture pointage:", e);
      }
    }

    sessionStorage.removeItem('poste_employe_id');
    sessionStorage.removeItem('poste_employe_nom');
    sessionStorage.removeItem('poste_employe_role');
    sessionStorage.removeItem('poste_session_travail_id');
    
    if (etabId) {
      navigate(`/poste/${etabId}`);
    } else {
      navigate('/choisir-role');
    }
  };

  return { idEmploye, nomEmploye, roleEmploye, etablissementId, quitterPoste };
};
