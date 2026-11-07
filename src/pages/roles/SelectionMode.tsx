import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, ChefHat, Receipt, LayoutDashboard, 
  LogOut, Key, ArrowRight, ShieldCheck, 
  Zap, X, User, Crown, Activity, Database, Sparkles, Monitor
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const SelectionMode = () => {
  const navigate = useNavigate();
  const { profil, deconnexion, etablissementSimuleId } = useAuthStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const modes = [
    {
      id: 'serveur',
      titre: 'Flux Service',
      description: 'Prise de commande mobile et gestion des tables live.',
      icon: <Smartphone size={32} />,
      role: 'serveur',
      route: '/serveur',
      badge: 'SALLE',
    },
    {
      id: 'cuisine',
      titre: 'Production',
      description: 'Moniteur KDS pour la gestion des bons de commande.',
      icon: <ChefHat size={32} />,
      role: 'cuisine',
      route: '/cuisine',
      badge: 'CUISINE',
    },
    {
      id: 'caisse',
      titre: 'Encaissement',
      description: 'Clôture des ventes, facturation et fonds de caisse.',
      icon: <Receipt size={32} />,
      role: 'caissier',
      route: '/caisse',
      badge: 'FINANCE',
    },
    {
      id: 'admin',
      titre: 'Gestion Pro',
      description: 'Pilotage stratégique, stocks et rapports financiers.',
      icon: <LayoutDashboard size={32} />,
      role: 'admin',
      route: '/tableau-de-bord',
      badge: 'MANAGER',
    },
    {
        id: 'livraison',
        titre: 'Logistique',
        description: 'Suivi des courses et livraisons à domicile.',
        icon: <Activity size={32} />,
        role: 'livreur',
        route: '/serveur',
        badge: 'LIVREUR',
    },
    ...(profil?.role === 'super_admin' ? [{
      id: 'super-admin',
      titre: 'SaaS Control',
      description: 'Administration globale et gestion des licences clients.',
      icon: <Database size={32} />,
      role: 'super_admin',
      route: '/super-admin',
      badge: 'SYSTEM',
    }] : []),
  ];

  const gererSelection = (mode: any) => {
    if (profil?.role === 'super_admin') {
      toast.success("Accès Super Admin");
      navigate('/super-admin');
      return;
    }

    setSelectedMode(mode);
    setShowPinModal(true);
    setPin('');
  };

  const validerPIN = async (currentPin: string) => {
    if (profil?.role === 'super_admin') {
      toast.success("Accès Stratégique Autorisé");
      
      sessionStorage.setItem('poste_employe_id', profil.id);
      sessionStorage.setItem('poste_employe_nom', profil.prenom || profil.nom || 'Super Admin');
      sessionStorage.setItem('poste_employe_role', 'admin');

      setShowPinModal(false);
      navigate(selectedMode.id === 'admin' ? '/tableau-de-bord' : selectedMode.route);
      return;
    }

    setLoading(true);
    try {
      const etablissementId = etablissementSimuleId || profil?.etablissement_id || 'demo';
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', currentPin)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const employe = snap.docs[0].data();
        const estAdmin = employe.role === 'admin' || employe.role === 'gerant';

        if (estAdmin || employe.role === selectedMode.role) {
          toast.success(`Session : ${employe.nom}`);
          
          sessionStorage.setItem('poste_employe_id', employe.id);
          sessionStorage.setItem('poste_employe_nom', employe.nom);
          sessionStorage.setItem('poste_employe_role', employe.role);

          setShowPinModal(false);
          if (estAdmin && selectedMode.id === 'admin') {
            navigate('/tableau-de-bord');
          } else {
            navigate(selectedMode.route);
          }
        } else {
          toast.error(`Accès restreint : ${selectedMode.badge}`);
          setPin('');
        }
      } else if (currentPin === '0000') {
        toast.success("Mode Simulation : Actif");
        
        sessionStorage.setItem('poste_employe_id', 'demo_simulation');
        sessionStorage.setItem('poste_employe_nom', 'Mode Simulation');
        sessionStorage.setItem('poste_employe_role', 'admin');

        setShowPinModal(false);
        navigate(selectedMode.id === 'admin' ? '/tableau-de-bord' : selectedMode.route);
      } else {
        toast.error('Code PIN Incorrect');
        setPin('');
      }
    } catch (error) {
      toast.error('Échec de la liaison sécurisée');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !loading) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        validerPIN(newPin);
      }
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPinModal || loading) return;
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
      else if (e.key === 'Escape') setShowPinModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, loading, pin]);

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] -mr-96 -mt-96" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] -ml-48 -mb-48" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20 relative z-10"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-full shadow-xl shadow-blue-900/5 border border-slate-100 mb-8">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">Terminal Sécurisé Actif</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-[#1E3A8A] uppercase leading-none">
          Bonjour, <span className="text-[#FF7A00]">{profil?.nom || 'Équipe'}</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs">
          Sélectionnez votre unité opérationnelle
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-[1400px] w-full relative z-10">
        <AnimatePresence>
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -12 }}
              onClick={() => gererSelection(mode)}
              className="group relative h-[420px] rounded-[3.5rem] p-10 bg-white border border-slate-100 hover:border-[#1E3A8A] transition-all duration-500 flex flex-col items-start text-left shadow-2xl shadow-blue-900/5 hover:shadow-blue-900/15 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="mb-12 p-6 rounded-[2rem] bg-slate-50 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-white transition-all duration-500 shadow-inner relative z-10">
                {mode.icon}
              </div>

              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-blue-50 text-[#1E3A8A] rounded-full text-[9px] font-black tracking-widest uppercase border border-blue-100">
                        {mode.badge}
                    </span>
                    {i < 3 && <Sparkles size={14} className="text-[#FF7A00]" />}
                </div>
                <h2 className="text-3xl font-black mb-4 text-[#1E3A8A] tracking-tighter uppercase leading-tight">
                  {mode.titre}
                </h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                  {mode.description}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3 text-slate-300 group-hover:text-[#FF7A00] transition-all font-black text-[10px] tracking-widest relative z-10 uppercase">
                Ouvrir la session <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => { deconnexion(); navigate('/connexion'); }}
        className="mt-20 px-10 py-5 rounded-full flex items-center gap-4 text-slate-400 hover:text-[#1E3A8A] hover:bg-white hover:shadow-2xl hover:shadow-blue-900/10 transition-all font-black text-[10px] tracking-[0.3em] uppercase border border-slate-100 bg-white/50"
      >
        <LogOut size={16} /> Changer d'établissement
      </motion.button>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1E3A8A]/40 backdrop-blur-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[4rem] p-12 text-center shadow-[0_50px_100px_-20px_rgba(30,58,138,0.3)] relative overflow-hidden border border-white"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-8 text-[#1E3A8A] shadow-inner">
                 {selectedMode?.icon || <Key size={32} />}
              </div>

              <h3 className="text-3xl font-black text-[#1E3A8A] mb-2 uppercase tracking-tighter">{selectedMode?.titre}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mb-12">Identification Requise</p>
              
              <div className="flex justify-center gap-5 mb-14">
                {[0, 1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={pin.length > i ? { scale: [1, 1.4, 1] } : {}}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-[#FF7A00] shadow-[0_0_20px_rgba(255,122,0,0.4)]' 
                        : 'bg-slate-200'
                    }`} 
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-5">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button
                    key={n}
                    onClick={() => handleKeyPress(n.toString())}
                    className="h-20 rounded-[1.8rem] bg-slate-50 hover:bg-blue-50 active:scale-90 border border-slate-100 text-[#1E3A8A] text-3xl font-black transition-all flex items-center justify-center"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-20 rounded-[1.8rem] bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-90 border border-rose-100 flex items-center justify-center transition-all"
                >
                  <X size={28} />
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-20 rounded-[1.8rem] bg-slate-50 hover:bg-blue-50 active:scale-90 border border-slate-100 text-[#1E3A8A] text-3xl font-black transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="h-20 rounded-[1.8rem] bg-white hover:bg-slate-50 active:scale-90 border border-slate-200 text-slate-400 font-black text-[10px] tracking-widest uppercase transition-all"
                >
                  X
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-50">
                   <div className="w-16 h-16 border-4 border-slate-100 border-t-[#1E3A8A] rounded-full animate-spin" />
                   <p className="text-[#1E3A8A] font-black uppercase tracking-[0.4em] text-[10px]">Vérification...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectionMode;
