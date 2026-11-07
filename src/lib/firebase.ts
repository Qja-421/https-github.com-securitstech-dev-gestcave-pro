import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration chargée via les variables d'environnement (Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForGestCaveDevMode12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gestcave-pro.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gestcave-pro',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gestcave-pro.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Activation de la persistance hors-ligne avancée
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Fonction pour vider le cache en cas de "moulinage" (appelée depuis l'admin)
export const clearFirestoreCache = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    window.location.reload();
  } catch (err) {
    console.error("Erreur vidage cache:", err);
    window.location.reload();
  }
};

export const storage = getStorage(app);

export default app;
