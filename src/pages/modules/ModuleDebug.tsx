import React, { useState, useEffect } from 'react';
import { 
  Terminal, ShieldAlert, Database, Wifi, WifiOff, 
  RefreshCcw, Trash2, AlertCircle, CheckCircle2, 
  Layers, User, Landmark, HardDrive, Cpu, Activity, History as HistoryIcon
} from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const ModuleDebug = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const posStore = usePOSStore();
  const [dbStatus, setDbStatus] = useState<'testing' | 'online' | 'offline'>('testing');
  const [logs, setLogs] = useState<{msg: string, time: string, type: 'info'|'error'|'warn'}[]>([]);

  const addLog = (msg: string, type: 'info'|'error'|'warn' = 'info') => {
    setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const checkConnectivity = async () => {
    setDbStatus('testing');
    addLog("Test de connexion Firestore...");
    try {
      const q = query(collection(db, 'etablissements'), limit(1));
      await getDocs(q);
      setDbStatus('online');
      addLog("Connexion Firestore établie.", 'info');
    } catch (e: any) {
      setDbStatus('offline');
      addLog(`Erreur Firestore: ${e.message}`, 'error');
    }
  };

  useEffect(() => {
    checkConnectivity();
    addLog("Module Debug initialisé.");
  }, []);

  const clearSessionStorage = () => {
    sessionStorage.clear();
    addLog("SessionStorage vidé.", 'warn');
    toast.success("Cache de session vidé");
  };

  const forceRefresh = () => {
    addLog("Rafraîchissement forcé...");
    window.location.reload();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Support */}
      <div className="bg-[#1E3A8A] p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Terminal size={32} className="text-[#FF7A00]" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Console de Diagnostic</h1>
              <p className="text-blue-200/60 font-bold uppercase tracking-widest text-xs mt-1">Maintenance & Support Technique GestCave Pro</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={checkConnectivity}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <RefreshCcw size={14} /> Tester Connexion
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne 1 : États Systèmes */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Statut Réseau & DB */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
               <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Wifi size={18} /> Connectivité
               </h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">Internet</span>
                    {posStore.isOnline ? (
                      <span className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-3 py-1 rounded-full"><Wifi size={12}/> Online</span>
                    ) : (
                      <span className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase bg-rose-50 px-3 py-1 rounded-full"><WifiOff size={12}/> Offline</span>
                    )}
                 </div>
                 <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 uppercase">Firestore (DB)</span>
                    <span className={`font-black text-[10px] uppercase px-3 py-1 rounded-full ${
                      dbStatus === 'online' ? 'text-emerald-600 bg-emerald-50' : 
                      dbStatus === 'testing' ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'
                    }`}>
                      {dbStatus}
                    </span>
                 </div>
               </div>
            </div>

            {/* Identité Contextuelle */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
               <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest mb-6 flex items-center gap-2">
                 <User size={18} /> Contexte Actif
               </h3>
               <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Établissement</p>
                    <p className="text-[11px] font-mono font-bold text-[#1E3A8A] break-all">{posStore.etablissement_id || 'Non défini'}</p>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rôle Utilisateur</p>
                    <p className="text-[11px] font-bold text-[#FF7A00] uppercase">{profil?.role || 'Inconnu'}</p>
                 </div>
               </div>
            </div>
          </div>

          {/* État du Store POS */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2">
                  <Database size={18} /> Cache Local (Zustand)
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Données en mémoire</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Produits', val: posStore.produits.length, icon: <Layers size={14}/> },
                  { label: 'Tables', val: posStore.tables.length, icon: <Activity size={14}/> },
                  { label: 'Commandes', val: posStore.commandes.length, icon: <RefreshCcw size={14}/> },
                  { label: 'Sessions', val: posStore.historiqueSessions.length, icon: <HistoryIcon size={14}/> }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="text-blue-400 mb-2 flex justify-center">{item.icon}</div>
                    <p className="text-2xl font-black text-[#1E3A8A]">{item.val}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Console de Logs */}
          <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800">
             <div className="bg-slate-800 px-8 py-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Système de Trace</span>
                </div>
                <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
             </div>
             <div className="h-96 overflow-y-auto p-8 font-mono text-[11px] space-y-2 no-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-slate-600 italic">Aucun événement enregistré...</p>
                ) : logs.map((log, i) => (
                  <div key={i} className={`flex gap-4 p-2 rounded ${
                    log.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 
                    log.type === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400'
                  }`}>
                    <span className="opacity-30 shrink-0">[{log.time}]</span>
                    <span className="font-bold shrink-0">[{log.type.toUpperCase()}]</span>
                    <span className="break-all">{log.msg}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Colonne 2 : Outils d'Urgence */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 border-t-4 border-t-rose-500">
              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldAlert size={18} /> Actions Critiques
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">
                Utilisez ces outils uniquement si l'application semble bloquée ou si les données ne se synchronisent plus.
              </p>
              
              <div className="space-y-4">
                 <button 
                  onClick={clearSessionStorage}
                  className="w-full p-6 bg-slate-50 hover:bg-rose-50 rounded-2xl border border-slate-100 hover:border-rose-100 text-left transition-all group"
                 >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-rose-500 shadow-sm"><Trash2 size={16}/></div>
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Vider le cache Session</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Réinitialise les identifiants de poste et les paramètres temporaires.</p>
                 </button>

                 <button 
                  onClick={forceRefresh}
                  className="w-full p-6 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-100 hover:border-blue-100 text-left transition-all group"
                 >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-[#1E3A8A] shadow-sm"><RefreshCcw size={16}/></div>
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Forcer Redémarrage</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Force le rechargement complet de l'application depuis le serveur.</p>
                 </button>

                 <div className="pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl text-[#1E3A8A]">
                       <AlertCircle size={20} />
                       <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest">Support Technique</p>
                          <p className="text-[9px] font-bold opacity-60">assistance@gestcave-pro.com</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Hardware Simulator (Visual only) */}
           <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Cpu size={14} /> Ressources Système
              </h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                       <span>CPU usage</span>
                       <span>2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 w-[2%]" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                       <span>Memory</span>
                       <span>124 MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-[#FF7A00] w-[15%]" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDebug;
