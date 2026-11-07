import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Check, Clock, Bell, ChefHat, CheckCircle2, 
  Wine, LogOut, Zap, UtensilsCrossed, 
  Search, AlertCircle, Timer, ChevronRight, X, LayoutDashboard,
  Flame, History, Play, CheckCircle, MoreHorizontal, Info,
  Volume2, VolumeX, Printer, RotateCcw, Filter, Utensils,
  User, Hash, MapPin, Scissors, Sparkles, Coffee, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePOSStore } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { Commande, LigneCommande } from '../../store/posStore';

const InterfaceCuisine = () => {
  const { 
    commandes, 
    tables,
    marquerLignePrete, 
    marquerLigneEnPreparation, 
    marquerToutesLignesPretes,
    marquerCommandeServie,
    etablissement_id: posEtabId
  } = usePOSStore();
  const { nomEmploye, quitterPoste } = usePosteSession();
  const navigate = useNavigate();
  
  const [posteId, setPosteId] = useState<string | null>(localStorage.getItem('kds_poste') || 'tous');
  const [showPosteSelector, setShowPosteSelector] = useState(false);
  const [sonActif, setSonActif] = useState(true);
  const [view, setView] = useState<'kds' | 'historique'>('kds');
  const [now, setNow] = useState(Date.now());
  const prevCommandesCount = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const activeCmdsForStation = commandes.filter(c => 
      (c.statut === 'envoyee' || c.statut === 'en_preparation') && 
      c.lignes.some(l => filterLigne(l) && l.statut === 'en_attente')
    );
    
    if (activeCmdsForStation.length > prevCommandesCount.current && sonActif) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio block:", e));
        toast.success("NOUVELLE COMMANDE REÇUE", { 
            icon: '🔥',
            style: { background: '#1E3A8A', color: '#fff', fontWeight: '800', borderRadius: '1rem' } 
        });
    }
    prevCommandesCount.current = activeCmdsForStation.length;
  }, [commandes, sonActif, posteId]);

  const selectPoste = (id: string) => {
    setPosteId(id);
    localStorage.setItem('kds_poste', id);
    setShowPosteSelector(false);
  };

  const filterLigne = (l: LigneCommande) => {
    if (!posteId || posteId === 'tous') return true;
    return l.destination === posteId;
  };

  const commandesKDS = useMemo(() => {
    return commandes.filter(c => {
        if (c.tableId) {
          const table = tables.find(t => t.id === c.tableId);
          if (table && table.statut === 'libre') return false;
        }
        const isStatutOk = c.statut === 'envoyee' || c.statut === 'en_preparation';
        const hasLinesForPoste = c.lignes.some(l => filterLigne(l) && l.statut !== 'servi');
        return isStatutOk && hasLinesForPoste;
    }).sort((a, b) => new Date(a.dateOuverture).getTime() - new Date(b.dateOuverture).getTime());
  }, [commandes, tables, posteId]);

  const minutesEcoulees = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 60000);

  if (showPosteSelector) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-6 md:p-12 font-['Inter',sans-serif]">
        <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-3xl" />
        <div className="max-w-4xl w-full bg-white p-12 md:p-20 rounded-[4rem] relative shadow-2xl animate-in zoom-in-95 duration-500 border border-white/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
            
            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center text-[#1E3A8A] shadow-inner relative z-10">
                <ChefHat size={48} />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tight mb-4 text-center leading-tight relative z-10 uppercase">Station de Production</h2>
            <p className="text-slate-400 font-bold text-sm mb-16 text-center uppercase tracking-[0.3em] relative z-10">Assignez ce terminal à un poste spécifique</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                {[
                  { id: 'cuisine', label: 'Cuisine Centrale', icon: <Utensils size={32} />, color: 'blue' },
                  { id: 'bar', label: 'Bar & Comptoir', icon: <Wine size={32} />, color: 'emerald' },
                  { id: 'pizzeria', label: 'Four / Pizza', icon: <Flame size={32} />, color: 'orange' },
                  { id: 'grill', label: 'Grillades', icon: <Flame size={32} />, color: 'rose' },
                  { id: 'cafe', label: 'Cafétéria', icon: <Coffee size={32} />, color: 'amber' },
                  { id: 'tous', label: 'Vue Globale', icon: <LayoutDashboard size={32} />, color: 'slate' },
                ].map(p => (
                  <button key={p.id} onClick={() => selectPoste(p.id)}
                    className="h-44 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-[#1E3A8A] hover:bg-white transition-all shadow-sm group active:scale-95"
                  >
                    <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-sm group-hover:bg-blue-50 transition-colors`}>
                        {p.icon}
                    </div>
                    <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">{p.label}</span>
                  </button>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] text-slate-800 overflow-hidden">
      {/* KDS Header */}
      <header className="h-28 bg-[#1E3A8A] px-10 flex items-center justify-between shadow-2xl relative z-30">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#FF7A00] shadow-lg border border-white/10">
                      <User size={32} />
                  </div>
                  <div>
                      <h1 className="text-white font-black text-xl tracking-tight uppercase leading-none">
                        Bienvenue, <span className="text-[#FF7A00]">{nomEmploye?.split(' ')[0]}</span> !
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-blue-300 font-bold text-[10px] uppercase tracking-widest">Cuisinier • {nomEmploye}</p>
                      </div>
                  </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                  <button onClick={() => setView('kds')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'kds' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                    Bons en cours
                  </button>
                  <button onClick={() => setView('historique')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'historique' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                    Historique
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <button onClick={() => setSonActif(!sonActif)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${sonActif ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {sonActif ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="text-right">
                  <p className="text-white font-black text-xs uppercase">{nomEmploye}</p>
                  <button onClick={quitterPoste} className="text-rose-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 justify-end mt-1 hover:text-rose-300">
                    Déconnexion <LogOut size={12} />
                  </button>
              </div>
          </div>
      </header>

      {/* KDS Main Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar bg-slate-900 p-8">
          <div className="flex gap-8 h-full items-start">
             {commandesKDS.map((cmd) => {
               const retard = minutesEcoulees(cmd.dateOuverture) >= 15;
               return (
                 <div key={cmd.id} className={`w-[420px] shrink-0 bg-white rounded-[2.5rem] flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 relative overflow-hidden border-4 ${retard ? 'border-rose-500' : 'border-slate-100'}`}>
                    {retard && (
                        <div className="absolute top-0 right-0 p-4 bg-rose-500 text-white flex items-center gap-2 rounded-bl-3xl shadow-lg">
                            <Clock size={16} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase">En Retard</span>
                        </div>
                    )}
                    
                    <div className={`p-8 border-b border-slate-50 flex justify-between items-start ${retard ? 'bg-rose-50/50' : 'bg-slate-50'}`}>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${retard ? 'bg-rose-100 text-rose-600' : 'bg-[#1E3A8A] text-white'}`}>
                                    {cmd.type === 'a_emporter' ? 'À EMPORTER' : 'EN SALLE'}
                                </div>
                                <div className="px-4 py-1 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} /> SERVEUR : {cmd.serveurNom || 'INCONNU'}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest"># {cmd.id.slice(-4).toUpperCase()}</span>
                            </div>
                            <h3 className="text-3xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none">
                                {cmd.type === 'a_emporter' ? (cmd.clientNom || 'Client Direct') : `TABLE ${cmd.tableNom || 'INCONNUE'}`}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-black ${retard ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>{minutesEcoulees(cmd.dateOuverture)} min</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(cmd.dateOuverture).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                        {cmd.lignes.filter(filterLigne).map((ligne, idx) => (
                           <div key={idx} className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-6 ${
                             ligne.statut === 'pret' ? 'bg-emerald-50 border-emerald-100 opacity-60' : 
                             ligne.statut === 'en_preparation' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'
                           }`}>
                                <div className="flex-1 flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                                        ligne.statut === 'pret' ? 'bg-emerald-100 text-emerald-600' : 
                                        ligne.statut === 'en_preparation' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {ligne.quantite}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <h4 className={`text-xl font-black tracking-tight leading-none uppercase ${ligne.statut === 'pret' ? 'text-emerald-700' : 'text-[#1E3A8A]'}`}>{ligne.produitNom}</h4>
                                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ligne.destination === 'bar' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {ligne.destination || 'Cuisine'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {ligne.note && <p className="text-rose-500 font-black text-[10px] uppercase bg-rose-50 px-2 py-1 rounded-lg inline-block">Note: {ligne.note}</p>}
                                            {ligne.datePreparationStart && ligne.datePret && (
                                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    <Timer size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cuit en {Math.floor((new Date(ligne.datePret).getTime() - new Date(ligne.datePreparationStart).getTime()) / 60000)} min</span>
                                                </div>
                                            )}
                                            {ligne.datePreparationStart && !ligne.datePret && (
                                                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg animate-pulse">
                                                    <Flame size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">En cuisson: {Math.floor((Date.now() - new Date(ligne.datePreparationStart).getTime()) / 60000)} min</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    {ligne.statut === 'en_attente' && (
                                        <button onClick={() => marquerLigneEnPreparation(cmd.id, ligne.id)} className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10 active:scale-90"><Play size={24} /></button>
                                    )}
                                    {ligne.statut !== 'pret' && (
                                        <button onClick={() => marquerLignePrete(cmd.id, ligne.id)} className="w-14 h-14 bg-[#1E3A8A] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20 active:scale-90"><Check size={28} /></button>
                                    )}
                                    {ligne.statut === 'pret' && (
                                        <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20"><CheckCircle size={28} /></div>
                                    )}
                                </div>
                           </div>
                        ))}
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                        <button 
                          onClick={async () => {
                            const toastId = toast.loading("Signalement au serveur...");
                            // On marque tout comme prêt pour ce poste
                            await marquerToutesLignesPretes(cmd.id, posteId || 'tous');
                            
                            // On crée la notification manuellement ici pour être précis
                            const { addDoc, collection } = await import('firebase/firestore');
                            const { db } = await import('../../lib/firebase');
                            const station = posteId?.toUpperCase() || 'CUISINE';
                            
                            await addDoc(collection(db, 'notifications_postes'), {
                              etablissement_id: posEtabId,
                              serveurId: cmd.serveurId,
                              commandeId: cmd.id,
                              tableNom: cmd.tableNom || 'Emporter',
                              type: 'pret_pour_service',
                              message: `[${station}] La commande pour la table ${cmd.tableNom || 'Emporter'} est prête !`,
                              date: new Date().toISOString(),
                              statut: 'non_lu'
                            });

                            toast.success("Serveur alerté !", { id: toastId });
                          }} 
                          className="w-full h-20 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-4 group hover:bg-emerald-500 transition-all active:scale-95"
                        >
                            <Bell size={28} className="group-hover:animate-ring" /> PRÊT POUR SERVICE
                        </button>
                        
                        <div className="flex justify-between items-center px-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Utensils size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{cmd.lignes.filter(l => filterLigne(l) && l.statut === 'pret').length} / {cmd.lignes.filter(filterLigne).length} items</span>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400"><User size={16} /></div>
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-500">+{cmd.serveurNom?.charAt(0)}</div>
                            </div>
                        </div>
                    </div>
                 </div>
               );
             })}

             {commandesKDS.length === 0 && (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                     <ChefHat size={120} className="text-white" />
                     <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Cuisine en attente</h2>
                     <p className="text-white font-bold text-sm uppercase tracking-[0.5em]">Aucune commande active au poste {posteId?.toUpperCase()}</p>
                 </div>
             )}
          </div>
      </main>

      {/* Footer / Stats */}
      <footer className="h-16 bg-white border-t border-slate-200 px-10 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(30,58,138,0.05)]">
          <div className="flex gap-8 items-center">
              <div className="flex items-center gap-2 text-emerald-500">
                  <CheckCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Liaison Chiffrée Active</span>
              </div>
              <div className="flex items-center gap-2 text-[#1E3A8A]">
                  <Timer size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cycle de rafraîchissement: 10s</span>
              </div>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">GestCave Pro KDS Management — v4.0.1</p>
      </footer>
    </div>
  );
};

export default InterfaceCuisine;
