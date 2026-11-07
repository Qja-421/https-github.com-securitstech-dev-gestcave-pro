import React, { useState } from 'react';
import { 
  Calendar, Play, Lock, ShieldCheck, 
  Clock, User, TrendingUp, ChevronRight,
  Wallet, CreditCard, Smartphone, AlertCircle,
  FileText, ArrowDownRight, History, Activity,
  Sparkles, LockKeyhole, ArrowRight, CheckCircle2,
  PieChart, BarChart3, Receipt
} from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const GestionSessions = () => {
  const { profil } = useAuthStore();
  const { sessionActive, historiqueSessions, ouvrirSession, fermerSession } = usePOSStore();
  const [fondsSaisi, setFondsSaisi] = useState<number>(0);
  const [showConfirmCloture, setShowConfirmCloture] = useState(false);

  const handleOuverture = async () => {
    if (sessionActive) {
      toast.error('Une session est déjà ouverte !');
      return;
    }
    
    const caissierId = sessionStorage.getItem('poste_employe_id') || profil?.id;
    const caissierNom = sessionStorage.getItem('poste_employe_nom') || profil?.nom;

    if (!caissierId || caissierId === 'admin') {
      toast.error("Veuillez vous identifier avec votre PIN personnel pour ouvrir la caisse.");
      return;
    }

    await ouvrirSession(fondsSaisi, caissierId, caissierNom || 'Opérateur');
    setFondsSaisi(0);
  };

  const handleCloture = async () => {
    if (!sessionActive) return;
    await fermerSession(fondsSaisi);
    setShowConfirmCloture(false);
    setFondsSaisi(0);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <History size={14} />
              Contrôle des Sessions
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Ouverture & <span className="text-[#FF7A00]">Clôture</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Gérez vos sessions de caisse, initialisez les fonds et validez vos rapports de fin de journée.</p>
        </div>

        <div className="flex gap-4 relative z-10">
            <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-900/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Système Live & Sécurisé</span>
            </div>
        </div>
      </header>

      {!sessionActive ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 p-16 md:p-24 text-center shadow-xl shadow-blue-900/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-orange-400" />
          <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner text-orange-500">
            <LockKeyhole size={48} />
          </div>
          <h3 className="text-4xl font-black text-[#1E3A8A] mb-6 tracking-tight uppercase">Responsabilité Individuelle</h3>
          <p className="text-slate-400 mb-12 max-w-md mx-auto font-medium text-lg leading-relaxed">
            L'ouverture de la caisse engage la responsabilité du caissier. <br/>
            <span className="text-[#1E3A8A] font-bold">Le patron ne peut pas ouvrir de session pour vous.</span>
          </p>
          
          <div className="max-w-md mx-auto bg-slate-50 p-10 md:p-12 rounded-[3rem] border border-slate-100 shadow-inner">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-6 px-1">Fonds de caisse initial confié (XAF)</label>
            <input 
              type="number" 
              value={fondsSaisi}
              onChange={(e) => setFondsSaisi(Number(e.target.value))}
              placeholder="0"
              className="w-full h-20 bg-white rounded-2xl text-center text-5xl font-black text-[#1E3A8A] outline-none focus:ring-4 focus:ring-blue-100 transition-all mb-10 shadow-sm border border-slate-100"
            />
            
            <div className="bg-white/50 p-4 rounded-xl border border-slate-200 mb-8 flex items-start gap-3 text-left">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                En initialisant, vous certifiez avoir vérifié le montant en espèces.
              </p>
            </div>

            <button 
              onClick={handleOuverture}
              className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm hover:bg-blue-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/20"
            >
              <Play size={20} className="fill-current" /> Ouvrir sous ma responsabilité
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Session Dashboard */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#1E3A8A] p-10 md:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                        <div className="flex items-center gap-3 bg-white/10 px-5 py-2 rounded-full border border-white/20 backdrop-blur-md">
                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Session Active</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">ID Session</p>
                            <p className="font-mono text-xs text-orange-400 font-bold tracking-widest uppercase">{sessionActive.id.slice(-12)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Opérateur Responsable</p>
                            <h3 className="text-4xl font-black tracking-tight mb-8 uppercase leading-none">{sessionActive.caissierNom}</h3>
                            
                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Ouverture</p>
                                    <div className="flex items-center gap-3 text-orange-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                        <Clock size={18} />
                                        <span className="font-black text-xl tracking-tight">{new Date(sessionActive.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                <div className="w-[1px] h-12 bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Fond de Base</p>
                                    <div className="flex items-center gap-3 text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                        <Wallet size={18} />
                                        <span className="font-black text-xl tracking-tight">{sessionActive.fondsInitial.toLocaleString()} <span className="text-[10px] opacity-30 uppercase">XAF</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-inner group-hover:bg-white/10 transition-colors">
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4">CA Théorique Actuel</p>
                            <div className="flex items-baseline gap-4 mb-8">
                                <span className="text-6xl font-black tracking-tighter text-orange-400">{(sessionActive.totalVentesTheorique || 0).toLocaleString()}</span>
                                <span className="text-lg font-bold text-white/30 tracking-tight uppercase">XAF</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-bold text-white/40 uppercase mb-2">Espèces</p>
                                    <p className="text-lg font-bold text-emerald-400">{(sessionActive.totalEspeces || 0).toLocaleString()} F</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-bold text-white/40 uppercase mb-2">Mobile</p>
                                    <p className="text-lg font-bold text-orange-400">{(sessionActive.totalMobile || 0).toLocaleString()} F</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-5 text-white/40">
                            <div className="p-3 bg-orange-400/10 rounded-2xl text-orange-400 border border-orange-400/20">
                               <AlertCircle size={24} />
                            </div>
                            <p className="text-xs font-medium uppercase tracking-widest max-w-sm leading-relaxed">
                                La clôture génère le rapport final et verrouille les transactions. Vérifiez les soldes physiques avant de confirmer.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowConfirmCloture(true)}
                            className="w-full md:w-auto px-10 h-20 bg-orange-500 hover:bg-white hover:text-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-4 shadow-2xl shadow-orange-900/30 group/btn"
                        >
                            <LockKeyhole size={20} className="group-hover/btn:scale-110 transition-transform" /> Clôturer la session
                        </button>
                    </div>
                </div>
            </div>

            {/* Inflow Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 shadow-inner group-hover:bg-blue-100 transition-colors">
                        <Smartphone size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transferts Mobile</p>
                    <p className="text-3xl font-black text-[#1E3A8A] tracking-tighter">{(sessionActive.totalMobile || 0).toLocaleString()} <span className="text-xs opacity-20 font-bold uppercase">XAF</span></p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-8 shadow-inner group-hover:bg-emerald-100 transition-colors">
                        <CreditCard size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Règlements Carte</p>
                    <p className="text-3xl font-black text-[#1E3A8A] tracking-tighter">{(sessionActive.totalCarte || 0).toLocaleString()} <span className="text-xs opacity-20 font-bold uppercase">XAF</span></p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-8 shadow-inner group-hover:bg-orange-100 transition-colors">
                        <Receipt size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Créances / Crédits</p>
                    <p className="text-3xl font-black text-orange-500 tracking-tighter">{(sessionActive.totalCredit || 0).toLocaleString()} <span className="text-xs opacity-20 font-bold uppercase">XAF</span></p>
                </div>
            </div>
          </div>

          {/* Fiscal Archive */}
          <div className="h-full">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#1E3A8A]">
                   <History size={20} />
                </div>
                <h4 className="text-lg font-extrabold text-[#1E3A8A] uppercase tracking-tight">Archives Sessions</h4>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-2 max-h-[700px] no-scrollbar">
                {historiqueSessions.length === 0 ? (
                    <div className="text-center py-24 opacity-20 flex flex-col items-center">
                        <BarChart3 size={64} className="mb-6" />
                        <p className="text-sm font-bold uppercase tracking-widest">Aucune archive</p>
                    </div>
                ) : (
                    historiqueSessions.sort((a,b) => new Date(b.dateOuverture).getTime() - new Date(a.dateOuverture).getTime()).map((s) => (
                        <div key={s.id} className="p-6 bg-slate-50 hover:bg-[#1E3A8A] rounded-[2rem] border border-slate-100 transition-all group cursor-pointer hover:shadow-xl hover:shadow-blue-900/20">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 group-hover:text-white/40 uppercase tracking-widest mb-1.5">
                                        {new Date(s.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                                    </p>
                                    <p className="font-black text-lg text-[#1E3A8A] group-hover:text-white tracking-tight uppercase leading-none">{s.caissierNom}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-[#1E3A8A] group-hover:text-orange-400 tracking-tighter">{(s.totalVentesTheorique || 0).toLocaleString()} <span className="text-[10px] opacity-30 group-hover:opacity-60">F</span></p>
                                    <div className="flex items-center justify-end gap-1.5 text-[9px] text-emerald-500 group-hover:text-emerald-300 font-bold uppercase tracking-widest mt-1.5">
                                       <CheckCircle2 size={12} /> Validé
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white/30 border-t border-slate-200 group-hover:border-white/10 pt-4">
                                <span className="flex items-center gap-2"><Clock size={14} /> Début: {new Date(s.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Termination Modal */}
      {showConfirmCloture && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
              <div onClick={() => setShowConfirmCloture(false)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
              <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-12 md:p-16 shadow-2xl relative animate-in zoom-in-95 duration-500 border border-white/20">
                  <div className="text-center mb-12">
                      <div className="w-20 h-20 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner text-orange-500">
                          <LockKeyhole size={40} />
                      </div>
                      <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-4 leading-none">Clôture Auditée</h3>
                      <p className="text-slate-500 font-medium text-lg">Veuillez saisir le montant physique total compté en espèces.</p>
                  </div>

                  <div className="space-y-10">
                      <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">
                              <span>Espèces attendues</span>
                              <span className="text-[#1E3A8A] font-black">{(sessionActive?.totalEspeces || 0).toLocaleString()} XAF</span>
                          </div>
                          <input 
                              type="number" 
                              autoFocus
                              value={fondsSaisi}
                              onChange={(e) => setFondsSaisi(Number(e.target.value))}
                              className="w-full text-center text-6xl font-black text-[#1E3A8A] bg-transparent outline-none tracking-tighter"
                          />
                      </div>

                      {fondsSaisi !== (sessionActive?.totalEspeces || 0) && (
                          <div className="bg-orange-50/50 border border-orange-100 rounded-[2rem] p-8 flex gap-6 animate-in fade-in duration-500">
                              <div className="p-3 bg-white rounded-2xl text-orange-500 shadow-sm shrink-0 h-fit">
                                 <AlertCircle size={24} />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-2">Écart de caisse détecté</p>
                                  <p className="text-slate-600 font-medium leading-relaxed">
                                      Une différence de <span className="text-orange-600 font-black decoration-2 underline-offset-4">{Math.abs(fondsSaisi - (sessionActive?.totalEspeces || 0)).toLocaleString()} XAF</span> sera enregistrée dans le rapport d'audit.
                                  </p>
                              </div>
                          </div>
                      )}

                      <div className="flex flex-col gap-4">
                          <button onClick={handleCloture} className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4">
                             Valider la clôture <ArrowRight size={20} />
                          </button>
                          <button onClick={() => setShowConfirmCloture(false)} className="w-full py-6 text-slate-300 font-bold uppercase text-xs tracking-widest hover:text-[#1E3A8A] transition-all">Abandonner la clôture</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionSessions;
