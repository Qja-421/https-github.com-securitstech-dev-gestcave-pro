import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

const genererPinInitial = () => Math.floor(1000 + Math.random() * 9000).toString();

export interface ProfilUtilisateur {
  id: string;
  email: string;
  role: 'super_admin' | 'client_admin' | 'employe';
  etablissement_id: string;
  etablissement_nom?: string;
  etablissement_status?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  departement?: string;
  nb_chaises?: number;
  type_etablissement?: 'restaurant' | 'bar' | 'mixte' | 'boutique';
}

interface EtatAuth {
  utilisateur: FirebaseUser | null;
  profil: ProfilUtilisateur | null;
  chargement: boolean;
  initialise: boolean;
  activationEnCours: boolean;
  etablissementSimuleId: string | null;
  setEtablissementSimule: (id: string | null) => void;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  inscription: (email: string, motDePasse: string, nom: string, etablissementNom: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  reinitialiserMotDePasse: (email: string) => Promise<void>;
  initialiser: () => void;
  finaliserActivation: (invitation: any, motDePasse: string) => Promise<void>;
  setActivationEnCours: (val: boolean) => void;
  activerModeDemo: (role?: 'super_admin' | 'client_admin' | 'employe', nom?: string, subRole?: string) => void;
}

export const useAuthStore = create<EtatAuth>((set, get) => ({
  utilisateur: null,
  profil: null,
  chargement: false,
  initialise: false,
  etablissementSimuleId: localStorage.getItem('gestcave_sim_etab_id'),

  setEtablissementSimule: (id) => {
    if (id) localStorage.setItem('gestcave_sim_etab_id', id);
    else localStorage.removeItem('gestcave_sim_etab_id');
    set({ etablissementSimuleId: id });
  },

  reinitialiserMotDePasse: async (email) => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  },

  initialiser: () => {
    onAuthStateChanged(auth, async (utilisateurFirebase) => {
      if (utilisateurFirebase) {
        // Si une activation est en cours, on laisse la méthode finaliserActivation gérer l'état
        if (get().activationEnCours) return;

        try {
          const profilRef = doc(db, 'utilisateurs', utilisateurFirebase.uid);
          let profilSnap = await getDoc(profilRef);
          
          // Retries multiples pour laisser le temps à Firestore
          let retries = 0;
          while (!profilSnap.exists() && retries < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            profilSnap = await getDoc(profilRef);
            retries++;
          }

          if (profilSnap.exists()) {
            const profilData = profilSnap.data() as ProfilUtilisateur;
            let statusEtab = 'actif';
            
            if (profilData.etablissement_id) {
              const etabSnap = await getDoc(doc(db, 'etablissements', profilData.etablissement_id));
              if (etabSnap.exists()) {
                statusEtab = etabSnap.data().statut || etabSnap.data().subscription_status || 'actif';
              }
            }

            set({ 
              utilisateur: utilisateurFirebase, 
              profil: { ...profilData, id: profilSnap.id, etablissement_status: statusEtab } as ProfilUtilisateur, 
              initialise: true 
            });
          } else {
            // Si vraiment pas de profil après retries, on initialise à null
            set({ utilisateur: utilisateurFirebase, profil: null, initialise: true });
          }
        } catch (error) {
          console.error("Erreur chargement profil:", error);
          set({ utilisateur: utilisateurFirebase, profil: null, initialise: true });
        }
      } else {
        set({ utilisateur: null, profil: null, initialise: true });
      }
    });
  },

  connexion: async (email, motDePasse) => {
    set({ chargement: true });
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, motDePasse);
      
      // Fetch profile immediately to avoid race condition with RoleGuard
      const profilRef = doc(db, 'utilisateurs', userCred.user.uid);
      const profilSnap = await getDoc(profilRef);
      
      if (profilSnap.exists()) {
        const profilData = profilSnap.data() as ProfilUtilisateur;
        let statusEtab = 'actif';
        
        if (profilData.etablissement_id) {
          const etabSnap = await getDoc(doc(db, 'etablissements', profilData.etablissement_id));
          if (etabSnap.exists()) {
            statusEtab = etabSnap.data().statut || etabSnap.data().subscription_status || 'actif';
          }
        }

        set({ 
          utilisateur: userCred.user, 
          profil: { ...profilData, id: profilSnap.id, etablissement_status: statusEtab } as ProfilUtilisateur,
          initialise: true
        });
      }
    } finally {
      set({ chargement: false });
    }
  },

  inscription: async (email, motDePasse, nom, etablissementNom) => {
    set({ chargement: true });
    try {
      // 1. Création du compte Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, motDePasse);
      const uid = userCred.user.uid;

      // 2. Création de l'établissement
      const etabRef = await addDoc(collection(db, 'etablissements'), {
        nom: etablissementNom,
        proprietaire_id: uid,
        date_creation: new Date().toISOString(),
        statut: 'en_attente_validation', // Le Super Admin doit valider
        modules_actifs: []
      });

      // 3. Création du profil utilisateur
      const profilData: Omit<ProfilUtilisateur, 'id'> = {
        email,
        role: 'client_admin',
        etablissement_id: etabRef.id,
        etablissement_nom: etablissementNom,
        nom
      };
      
      await setDoc(doc(db, 'utilisateurs', uid), profilData);

      // 4. Création de l'employé "Patron" pour le PIN par défaut
      await setDoc(doc(db, 'employes', uid), {
        id: uid,
        nom: nom,
        email: email,
        role: 'admin',
        pin: genererPinInitial(),
        pin_initial_a_changer: true,
        etablissement_id: etabRef.id,
        actif: true
      });

      // Mise à jour locale du profil
      set({ profil: { id: uid, ...profilData }, utilisateur: userCred.user, initialise: true });

    } finally {
      set({ chargement: false });
    }
  },

  deconnexion: async () => {
    await signOut(auth);
    set({ utilisateur: null, profil: null });
  },

  activationEnCours: false,
  setActivationEnCours: (val) => set({ activationEnCours: val }),

  finaliserActivation: async (invitation, motDePasse) => {
    set({ chargement: true, activationEnCours: true });
    try {
      // 1. Récupération de l'email (gestion de la flexibilité des noms de champs)
      const email = invitation.email || invitation.email_contact;
      
      if (!email) {
        throw new Error("L'adresse email est manquante dans l'invitation. Veuillez générer un nouveau lien.");
      }

      // 2. Création du compte Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, motDePasse);
      const uid = userCred.user.uid;

      // 3. Création du profil Firestore
      const profilData: ProfilUtilisateur = {
        id: uid,
        email: email,
        nom: invitation.nom,
        prenom: 'Patron',
        role: 'client_admin',
        etablissement_id: invitation.etablissement_id,
      };
      
      await setDoc(doc(db, 'utilisateurs', uid), {
        ...profilData,
        date_creation: new Date().toISOString()
      });

      // 3. Création du profil Employé Maître
      await setDoc(doc(db, 'employes', uid), {
        id: uid,
        nom: invitation.nom,
        prenom: 'Patron',
        email: invitation.email,
        role: 'admin',
        pin: genererPinInitial(),
        pin_initial_a_changer: true,
        etablissement_id: invitation.etablissement_id,
        actif: true
      });

      // 4. Supprimer l'invitation (Optionnel - ne doit pas bloquer l'activation si échec de permission)
      try {
        await deleteDoc(doc(db, 'invitations', invitation.id));
      } catch (e) {
        console.warn("Impossible de supprimer l'invitation:", e);
      }

      // 5. Récupérer les infos de l'établissement pour l'état local
      let statusEtab = 'actif';
      let nomEtab = 'Mon Établissement';
      const etabSnap = await getDoc(doc(db, 'etablissements', invitation.etablissement_id));
      if (etabSnap.exists()) {
        const etabData = etabSnap.data();
        statusEtab = etabData.statut || etabData.subscription_status || 'actif';
        nomEtab = etabData.nom || 'Mon Établissement';
      }

      // Mise à jour locale immédiate de l'état (avant de libérer le listener)
      set({ 
        utilisateur: userCred.user, 
        profil: { 
          ...profilData, 
          etablissement_nom: nomEtab, 
          etablissement_status: statusEtab 
        } as ProfilUtilisateur, 
        initialise: true,
        activationEnCours: false
      });

    } catch (error) {
      set({ activationEnCours: false });
      throw error;
    } finally {
      set({ chargement: false });
    }
  },

  activerModeDemo: (role = 'client_admin', nom = 'Gérant Démo V2.0', subRole = 'admin') => {
    const email = role === 'super_admin' ? 'superadmin@gestcave.pro' : `${subRole}@etoileducongo.com`;
    const dummyUser = {
      uid: 'demo-user-gestcave',
      email,
      displayName: nom,
    } as unknown as FirebaseUser;

    const demoProfil: ProfilUtilisateur = {
      id: 'demo-user-gestcave',
      email,
      role,
      nom,
      etablissement_id: 'etoile-du-congo-id',
      etablissement_nom: 'BAR-RESTAURANT "ÉTOILE DU CONGO"',
      etablissement_status: 'actif',
      type_etablissement: 'mixte'
    };

    sessionStorage.setItem('poste_employe_id', 'demo-user-gestcave');
    sessionStorage.setItem('poste_employe_nom', nom);
    sessionStorage.setItem('poste_employe_role', subRole);
    sessionStorage.setItem('poste_etablissement_id', 'etoile-du-congo-id');
    localStorage.setItem('temp_auth_user', JSON.stringify({ id: 'demo-user-gestcave', nom, role: subRole, etablissement_id: 'etoile-du-congo-id' }));
    localStorage.setItem('gestcave_sim_etab_id', 'etoile-du-congo-id');

    set({
      utilisateur: dummyUser,
      profil: demoProfil,
      initialise: true,
      chargement: false,
      etablissementSimuleId: 'etoile-du-congo-id'
    });
  },
}));
