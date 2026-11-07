import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Receipt, Shield, Clock, Zap, X, ArrowRight, Loader2, Server, Landmark, Monitor, Settings } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { usePOSStore } from '../store/posStore';
import { toast } from 'react-hot-toast';

const PagePoste = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const location = window.location;
  const { initialiserTempsReel } = usePOSStore();

  const [nomEtablissement, setNomEtablissement] = useState('Configuration...');
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const modes = [
    {
      id: 'serveur',
      titre: 'Poste Serveur',
      description: 'Prise de commande, gestion des tables et encaissements rapides.',
      icon: <Smartphone size={32} />,
      role: 'serveur',
      route: '/serveur',
      color: 'blue'
    },
    {
      id: 'cuisine',
      titre: 'Poste Cuisine',
      description: 'Réception des bons, préparation et suivi des envois.',
      icon: <ChefHat size={32} />,
      role: 'cuisine',
      route: '/cuisine',
      color: 'blue'
    },
    {
      id: 'caisse',
      titre: 'Poste Caisse',
      description: 'Clôture des tickets, facturation et gestion des paiements.',
      icon: <Receipt size={32} />,
      role: 'caissier',
      route: '/caisse',
      color: 'emerald'
    },
    {
      id: 'manager',
      titre: 'Console Gérant',
      description: 'Analyses financières, gestion du personnel et des stocks.',
      icon: <Shield size={32} />,
      role: 'gerant',
      route: `/manager/${etablissementId}`,
      color: 'orange'
    },
    {
      id: 'pointage',
      titre: 'Borne Pointage',
      description: 'Identification des employés, début/fin de service et pauses.',
      icon: <Clock size={32} />,
      role: 'any',
      route: `/pointage/${etablissementId}`,
      color: 'blue'
    },
  ];

  useEffect(() => {
    if (!etablissementId) return;
    
    const chargerEtablissement = async () => {
      try {
        const etabRef = doc(db, 'etablissements', etablissementId);
        const etabSnap = await getDoc(etabRef);
        
        if (etabSnap.exists()) {
          setNomEtablissement(etabSnap.data().nom || 'Établissement Principal');
          initialiserTempsReel(etablissementId);
        } else {
          toast.error('Lien de déploiement invalide.');
          setNomEtablissement('Lien expiré');
        }
      } catch (error) {
        setNomEtablissement('Erreur réseau');
      }
    };

    chargerEtablissement();
  }, [etablissementId, initialiserTempsReel]);

  // Détection automatique du rôle via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && modes.some(m => m.id === roleParam)) {
      const mode = modes.find(m => m.id === roleParam);
      if (mode) gererSelection(mode);
    }
  }, [location.search]);

  const gererSelection = (mode: any) => {
    if (mode.id === 'pointage') {
      navigate(mode.route);
      return;
    }
    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  // Support clavier physique
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPinModal || loading) return;

      if (e.key >= '0' && e.key <= '9') {
        setPinError(null);
        if (pin.length < 4) setPin(prev => prev + e.key);
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (pin.length === 4) verifierAcces();
      } else if (e.key === 'Escape') {
        setShowPinModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pin, loading]);

  const verifierAcces = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    
    try {
      const q = query(
        collection(db, 'employes'),
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', pin)
      );
      
      // Ajout d'un timeout de sécurité
      const getDocsPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );

      const snap = await Promise.race([getDocsPromise, timeoutPromise]) as any;
      
      if (!snap || snap.empty) {
        toast.error('Code PIN ou établissement invalide');
        setLoading(false);
        setPin('');
        return;
      }

      const employe = snap.docs[0].data();
      const employeId = snap.docs[0].id;
      
      // Vérification des droits
      if (selectedMode.role !== 'any' && employe.role !== selectedMode.role && employe.role !== 'admin' && employe.role !== 'gerant') {
        setPinError(`RÔLE INCOMPATIBLE (REQUIS : ${selectedMode.role.toUpperCase()})`);
        setPin('');
        setLoading(false);
        return;
      }

      // Vérification du pointage obligatoire (Présence active requise)
      // On exempte l'admin global pour les urgences techniques
      if (employe.role !== 'admin') {
        const qPointage = query(
          collection(db, 'pointage_presence'),
          where('employe_id', '==', employeId),
          where('statut', '==', 'present')
        );
        const snapPointage = await getDocs(qPointage);
        
        if (snapPointage.empty) {
          setPinError("PIN VALIDE. ACCÈS BLOQUÉ : POINTAGE OBLIGATOIRE AU TERMINAL.");
          setPin('');
          setLoading(false);
          return;
        }
      }

      // Connexion réussie
      toast.success(`Accès autorisé : ${employe.nom}`);
      
      // Sauvegarde des infos pour le hook usePosteSession
      sessionStorage.setItem('poste_employe_id', snap.docs[0].id);
      sessionStorage.setItem('poste_employe_nom', employe.nom);
      sessionStorage.setItem('poste_employe_role', employe.role);
      sessionStorage.setItem('poste_etablissement_id', etablissementId || '');
      
      // Compatibilité avec l'ancien système
      localStorage.setItem('temp_auth_user', JSON.stringify({ ...employe, id: snap.docs[0].id }));
      
      navigate(selectedMode.route);
      
    } catch (error: any) {
      console.error("Erreur validation PIN:", error);
      if (error.message === "Timeout") {
        toast.error('Le serveur ne répond pas. Vérifiez votre connexion.');
      } else {
        toast.error('Erreur de validation (Vérifiez les accès)');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-800 selection:bg-blue-100">
      {/* Top Banner */}
      <div className="h-[45vh] bg-[#1E3A8A] relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
          
          <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-blue-100 text-xs font-bold uppercase tracking-[0.3em] border border-white/10">
                  <Landmark size={14} className="text-[#FF7A00]" />
                  Architecture Node-Link GestCave
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                 {nomEtablissement}
              </h1>
              <p className="text-blue-200/60 font-bold uppercase tracking-widest text-sm">Sélectionnez le poste de travail pour ce terminal</p>
          </div>
      </div>

      {/* Mode Grid */}
      <div className="max-w-7xl mx-auto px-8 -mt-24 relative z-20 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modes.map((mode) => (
                  <button 
                    key={mode.id} 
                    onClick={() => gererSelection(mode)}
                    className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 text-left flex flex-col justify-between group hover:border-[#FF7A00] transition-all hover:-translate-y-2"
                  >
                      <div className={`w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner group-hover:bg-blue-50 transition-all ${
                        mode.color === 'orange' ? 'text-[#FF7A00]' : 
                        mode.color === 'emerald' ? 'text-emerald-500' : 'text-[#1E3A8A]'
                      }`}>
                          {mode.icon}
                      </div>
                      <div className="space-y-4">
                          <h3 className="text-3xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none">{mode.titre}</h3>
                          <p className="text-slate-400 font-medium text-sm leading-relaxed">{mode.description}</p>
                      </div>
                      <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#FF7A00] transition-colors">Activer le module</span>
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-[#1E3A8A] group-hover:text-white transition-all">
                              <ArrowRight size={20} />
                          </div>
                      </div>
                  </button>
              ))}

              {/* Maintenance / Help Card */}
              <div className="bg-slate-50 p-12 rounded-[3.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-6 opacity-60">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm"><Settings size={32} /></div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px]">En attente de nouveaux modules applicatifs</p>
              </div>
          </div>
      </div>

      {/* Footer Info */}
      <footer className="py-12 border-t border-slate-100 text-center space-y-6">
          <div className="flex justify-center items-center gap-8 text-[#1E3A8A]/30">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Liaison Chiffrée Active</span>
              </div>
              <div className="flex items-center gap-2">
                  <Monitor size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">ID Terminal: {etablissementId?.slice(-8).toUpperCase()}</span>
              </div>
          </div>
      </footer>

      {/* PIN Modal */}
      {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
              <div onClick={() => !loading && setShowPinModal(false)} className="absolute inset-0 bg-[#1E3A8A]/95 backdrop-blur-2xl" />
              <div className="bg-white w-full max-w-xl p-12 md:p-16 rounded-[4rem] shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-500">
                  <button onClick={() => setShowPinModal(false)} className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all">
                    <X size={24} />
                  </button>

                  <div className="mb-12 text-center">
                      <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Zap size={32} />
                      </div>
                      <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none mb-3">Authentification</h3>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Accès requis pour <span className="text-[#FF7A00]">{selectedMode?.titre}</span></p>
                  </div>

                  <div className="space-y-10">
                      <div className="flex justify-center gap-4">
                          {[0, 1, 2, 3].map((i) => (
                              <div key={i} className={`w-14 h-20 rounded-2xl flex items-center justify-center text-4xl font-black transition-all border-2 ${
                                  pin.length > i 
                                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl shadow-blue-900/20' 
                                  : 'bg-slate-50 border-slate-100 text-slate-200'
                              }`}>
                                  {pin.length > i ? '•' : ''}
                              </div>
                          ))}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <button key={num} onClick={() => { setPinError(null); pin.length < 4 && setPin(pin + num); }}
                                  className="h-20 bg-slate-50 hover:bg-blue-50 text-2xl font-black text-[#1E3A8A] rounded-[1.5rem] transition-all active:scale-90 border border-slate-100 shadow-sm">
                                  {num}
                              </button>
                          ))}
                          <button onClick={() => { setPinError(null); setPin(''); }} className="h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center hover:bg-rose-100 transition-all active:scale-90">
                              <X size={24} />
                          </button>
                          <button onClick={() => { setPinError(null); pin.length < 4 && setPin(pin + '0'); }} className="h-20 bg-slate-50 hover:bg-blue-50 text-2xl font-black text-[#1E3A8A] rounded-[1.5rem] transition-all active:scale-90 border border-slate-100">0</button>
                          <button onClick={verifierAcces} disabled={pin.length < 4 || loading}
                              className="h-20 bg-[#FF7A00] text-white rounded-[1.5rem] flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 shadow-xl shadow-orange-900/20 disabled:opacity-30">
                              {loading ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
                          </button>
                      </div>

                      {pinError && (
                          <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] animate-in slide-in-from-bottom-2 text-center shadow-inner">
                              <div className="flex items-center justify-center gap-3 text-rose-500 mb-2">
                                  <Shield size={24} />
                                  <h4 className="text-xl font-black uppercase tracking-tighter">Accès Refusé</h4>
                              </div>
                              <p className="text-rose-600 font-bold text-[11px] uppercase tracking-[0.2em] leading-relaxed">
                                  {pinError}
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PagePoste;
