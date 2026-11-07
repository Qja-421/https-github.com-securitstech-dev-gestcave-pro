import React, { useState, useEffect } from 'react';
import { 
  Clock, UserCheck, Coffee, LogOut, 
  Fingerprint, CheckCircle2, History, X, ShieldAlert,
  ArrowRight, Timer, Zap, Coffee as CoffeeIcon
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, query, where, getDocs, doc, updateDoc, 
  Timestamp, addDoc, limit, orderBy, getDoc 
} from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PagePointage = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [employe, setEmploye] = useState<any>(null);
  const [sessionActuelle, setSessionActuelle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [configRH, setConfigRH] = useState<any>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // 1. Chargement de la configuration (une seule fois à l'initialisation ou si l'ID change)
  useEffect(() => {
    const fetchConfig = async () => {
      if (!etablissementId) return;
      try {
        const docRef = doc(db, 'etablissements', etablissementId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfigRH(docSnap.data());
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la config RH:", error);
      }
    };
    fetchConfig();
  }, [etablissementId]);

  // 2. Support clavier physique (séparé)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || employe) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          const val = e.key;
          setPin(prev => {
             const n = prev + val;
             if (n.length === 4) verifierEmploye(n);
             return n;
          });
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading, employe]);

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePIN = async (val: string) => {
    if (loading) return;
    const nouveauPIN = pin + val;
    if (nouveauPIN.length <= 4) {
      setPin(nouveauPIN);
      if (nouveauPIN.length === 4) {
        verifierEmploye(nouveauPIN);
      }
    }
  };

  const verifierEmploye = async (code: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'employes'), 
        where('etablissement_id', '==', etablissementId),
        where('pin', '==', code)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error("Code PIN incorrect — Accès refusé");
        setPin('');
        setLoading(false);
        return;
      }

      const empData = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setEmploye(empData);
      
      const qSession = query(
        collection(db, 'pointage_presence'),
        where('employe_id', '==', empData.id),
        where('statut', 'in', ['present', 'pause']),
        limit(1)
      );
      const snapSession = await getDocs(qSession);
      if (!snapSession.empty) {
        const sessionData = snapSession.docs[0].data();
        const sessionId = snapSession.docs[0].id;
        const debutMs = sessionData.debut?.toMillis ? sessionData.debut.toMillis() : Date.now();
        const heuresEcoulees = (Date.now() - debutMs) / (1000 * 60 * 60);

        if (heuresEcoulees > 14) {
           // Auto-clôture de sécurité (oubli de départ)
           await updateDoc(doc(db, 'pointage_presence', sessionId), {
             fin: Timestamp.now(),
             statut: 'termine_auto',
             note_systeme: 'Oubli de badgeage départ'
           });
           toast.error("Oubli de départ détecté ! Votre session précédente a été fermée d'office. Veuillez badger à nouveau votre arrivée.", {
             duration: 6000, style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
           });
           // On réinitialise complètement pour forcer une nouvelle saisie du PIN claire
           setPin('');
           setEmploye(null);
           setSessionActuelle(null);
           setLoading(false);
           return;
        } else {
           setSessionActuelle({ id: sessionId, ...sessionData });
        }
      }

    } catch (error) {
      toast.error("Erreur de connexion au registre");
    } finally {
      setLoading(false);
    }
  };

  const actionPointage = async (type: 'arrivee' | 'pause_debut' | 'pause_fin' | 'depart') => {
    if (!employe) return;
    setLoading(true);
    let malusCalcule = 0;
    
    try {
      if (type === 'arrivee') {
        const maintenant = new Date();
        let noteRetard = "";

        if (configRH?.heureOuvertureStandard) {
          const [h, m] = configRH.heureOuvertureStandard.split(':').map(Number);
          const heureLimite = new Date();
          heureLimite.setHours(h, m + (configRH.toleranceRetard || 0), 0, 0);

          if (maintenant > heureLimite) {
            const minutesRetard = Math.floor((maintenant.getTime() - heureLimite.getTime()) / 60000);
            
            // Sécurité : 100 XAF par min par défaut et plafonné à 5000 XAF pour la démo
            const malusUnitaire = configRH.malusRetardParMinute || 100;
            malusCalcule = Math.min(minutesRetard * malusUnitaire, 5000);
            
            noteRetard = `Retard de ${minutesRetard}min constaté.`;

            // Enregistrement simple de la sanction sans recherche de récidive (évite besoin d'index complexe)
            try {
              await addDoc(collection(db, 'discipline'), {
                employe_id: employe.id,
                employe_nom: employe.nom,
                type: 'retard',
                montant: malusCalcule,
                date: maintenant.toISOString(),
                etablissement_id: etablissementId,
                note: noteRetard
              });
            } catch (disciplineError) {
              console.error("Erreur enregistrement discipline (permissions probables):", disciplineError);
            }
          }
        }

        await addDoc(collection(db, 'pointage_presence'), {
          employe_id: employe.id,
          employe_nom: employe.nom,
          etablissement_id: etablissementId,
          debut: Timestamp.now(),
          statut: 'present',
          pauses: [],
          retard_minutes: malusCalcule > 0 ? noteRetard : null
        });

        if (malusCalcule > 0) {
          toast.error(`Retard enregistré : -${malusCalcule.toLocaleString()} XAF`, { duration: 5000 });
        } else {
          toast.success(`Bon service, ${employe.nom} !`);
        }
      } else if (type === 'depart') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        await updateDoc(ref, {
          fin: Timestamp.now(),
          statut: 'termine'
        });
        toast.success("Service terminé — À bientôt !");
      } else if (type === 'pause_debut') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        const pauses = sessionActuelle.pauses || [];
        pauses.push({ debut: Timestamp.now() });
        await updateDoc(ref, { statut: 'pause', pauses });
        toast.success("Pause enregistrée");
      } else if (type === 'pause_fin') {
        const ref = doc(db, 'pointage_presence', sessionActuelle.id);
        const pauses = [...sessionActuelle.pauses];
        pauses[pauses.length - 1].fin = Timestamp.now();
        await updateDoc(ref, { statut: 'present', pauses });
        toast.success("Fin de pause");
      }
      setSuccessData({
        type: type === 'arrivee' ? 'BIENVENUE' : (type === 'depart' ? 'AU REVOIR' : 'CONFIRMÉ'),
        nom: employe.nom,
        malus: malusCalcule,
        message: type === 'arrivee' ? 'Bon service !' : (type === 'depart' ? 'À bientôt !' : 'Action enregistrée')
      });

      // On attend 5 secondes avant de réinitialiser pour que l'employé voit le message
      setTimeout(() => {
        setSuccessData(null);
        reinitialiser();
      }, 5000);
    } catch (error: any) {
      console.error("Erreur détaillée pointage:", error);
      toast.error(`Erreur : ${error.message || "Problème de connexion au serveur"}`);
    } finally {
      setLoading(false);
    }
  };

  const reinitialiser = () => {
    setPin('');
    setEmploye(null);
    setSessionActuelle(null);
  };

  return (
    <div className="min-h-screen bg-[#1E3A8A] font-['Inter',sans-serif] flex items-center justify-center p-6 md:p-12 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-800/30 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/40 rounded-full blur-[100px] -ml-64 -mb-64" />
      
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Info & Time */}
        <div className="space-y-12 text-white p-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/20 backdrop-blur-md rounded-full text-blue-200 text-xs font-bold uppercase tracking-widest border border-white/10">
                    <Zap size={14} className="text-[#FF7A00]" />
                    Borne de Pointage Intelligente
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">
                   GestCave <br/>
                   <span className="text-[#FF7A00]">Terminal</span>
                </h1>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
                <div className="flex items-baseline gap-4 mb-2">
                    <p className="text-7xl md:text-8xl font-black tracking-tighter text-white">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-2xl font-bold text-[#FF7A00] animate-pulse">:</span>
                    <span className="text-3xl font-bold text-blue-300">
                        {time.toLocaleTimeString([], { second: '2-digit' })}
                    </span>
                </div>
                <p className="text-lg font-bold text-blue-200/60 uppercase tracking-widest">
                    {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>

            <div className="flex items-center gap-8 px-4 opacity-40">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">Network Active</span>
                </div>
                <div className="flex items-center gap-3">
                    <ShieldAlert size={14} />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">Biometric Auth</span>
                </div>
            </div>
        </div>

        {/* Right Side: Keyboard & Actions */}
        <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-white">
            {!employe ? (
                <div className="space-y-12 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Fingerprint size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight">Identification</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Saisissez votre code PIN personnel</p>
                    </div>

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

                    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button key={num} onClick={() => handlePIN(num.toString())}
                                className="h-20 bg-slate-50 hover:bg-blue-50 text-2xl font-black text-[#1E3A8A] rounded-[1.5rem] transition-all active:scale-90 border border-slate-100 shadow-sm">
                                {num}
                            </button>
                        ))}
                        <button onClick={() => setPin('')} className="h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center hover:bg-rose-100 transition-all active:scale-90 shadow-sm">
                            <X size={28} />
                        </button>
                        <button onClick={() => handlePIN('0')} className="h-20 bg-slate-50 hover:bg-blue-50 text-2xl font-black text-[#1E3A8A] rounded-[1.5rem] transition-all active:scale-90 border border-slate-100 shadow-sm">0</button>
                        <button className="h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 border border-slate-100 opacity-30">
                            <ArrowRight size={28} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-12 animate-in slide-in-from-right duration-500">
                    <div className="text-center space-y-6">
                        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto shadow-inner border border-slate-100">
                            {employe.role === 'serveur' ? '🤵' : 
                             employe.role === 'caissier' ? '💰' : 
                             employe.role === 'cuisine' ? '👨‍🍳' : '👤'}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tighter leading-none mb-2">{employe.nom}</h2>
                            <p className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-[0.4em]">{employe.role}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {sessionActuelle && (
                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Session en cours</span>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${sessionActuelle.statut === 'pause' ? 'bg-orange-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                                        {sessionActuelle.statut === 'pause' ? 'EN PAUSE' : 'EN SERVICE'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Arrivée</p>
                                        <p className="text-lg font-black text-[#1E3A8A]">{new Date(sessionActuelle.debut?.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="w-px h-8 bg-blue-100" />
                                    <div className="flex-1 text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Durée</p>
                                        <p className="text-lg font-black text-[#1E3A8A]">
                                            {Math.floor((Date.now() - sessionActuelle.debut?.toMillis()) / (1000 * 60 * 60))}h {Math.floor(((Date.now() - sessionActuelle.debut?.toMillis()) / (1000 * 60)) % 60)}m
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!sessionActuelle ? (
                            <button onClick={() => actionPointage('arrivee')} disabled={loading}
                                className="h-24 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-blue-900/30 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95">
                                <UserCheck size={32} className="text-[#FF7A00]" />
                                Débuter le service
                            </button>
                        ) : (
                            <div className="space-y-4">
                                {sessionActuelle.statut === 'present' ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <button onClick={() => actionPointage('pause_debut')} disabled={loading}
                                            className="w-full h-24 bg-orange-50 text-orange-600 rounded-[2rem] font-black uppercase tracking-widest text-lg border-2 border-orange-100 hover:bg-orange-100 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-sm">
                                            <CoffeeIcon size={32} />
                                            Début de Pause
                                        </button>
                                        <button onClick={() => actionPointage('depart')} disabled={loading}
                                            className="w-full h-24 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase tracking-widest text-lg border-2 border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-sm">
                                            <LogOut size={32} />
                                            Fin de Travail
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <button onClick={() => actionPointage('pause_fin')} disabled={loading}
                                            className="w-full h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-lg border-2 border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-sm">
                                            <CheckCircle2 size={32} />
                                            Fin de Pause / Reprise
                                        </button>
                                        <button onClick={() => actionPointage('depart')} disabled={loading}
                                            className="w-full h-20 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 opacity-50 cursor-not-allowed">
                                            <LogOut size={20} />
                                            Fin de Travail (Reprendre d'abord)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={reinitialiser} className="w-full h-16 text-slate-400 font-bold uppercase tracking-widest text-xs hover:text-rose-500 transition-all">
                            Annuler l'opération
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center">
         <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em]">GestCave Pro Security Framework — v4.0.1</p>
      </div>
      {/* Overlay de Succès Explicite */}
      {successData && (
        <div className="absolute inset-0 z-[100] bg-[#1E3A8A] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <CheckCircle2 size={64} className="text-[#FF7A00]" />
            </div>
            
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                {successData.type}, {successData.nom} !
            </h2>
            <p className="text-blue-200 text-xl font-bold mb-12">{successData.message}</p>

            {successData.malus > 0 && (
                <div className="bg-rose-500/20 border-2 border-rose-500/50 p-8 rounded-[2.5rem] max-w-md w-full backdrop-blur-md">
                    <div className="flex items-center justify-center gap-3 text-rose-200 mb-2">
                        <ShieldAlert size={24} />
                        <span className="text-xs font-black uppercase tracking-widest">Alerte Retard</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                        -{successData.malus.toLocaleString()} XAF
                    </div>
                    <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">Malus déduit automatiquement de la prime</p>
                </div>
            )}

            <div className="absolute bottom-12 text-blue-300/50 text-[10px] font-black uppercase tracking-[0.3em]">
                Retour automatique à l'accueil dans quelques secondes...
            </div>
        </div>
      )}
    </div>
  );
};

export default PagePointage;
