import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Wallet, Users, ShoppingBag, Receipt, 
  ArrowLeft, LogOut, TrendingUp, AlertTriangle,
  Plus, Clock, Package, CheckCircle2, DollarSign,
  Activity, Calendar, ArrowRight, Zap, X, Filter, Loader2,
  TrendingDown, Briefcase, Landmark
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, 
  doc, getDoc, orderBy, limit 
} from 'firebase/firestore';
import { usePOSStore } from '../store/posStore';
import { toast } from 'react-hot-toast';

const PageTerminalManager = () => {
  const { etablissementId } = useParams<{ etablissementId: string }>();
  const navigate = useNavigate();
  const { initialiserTempsReel } = usePOSStore();

  const [employe, setEmploye] = useState<any>(null);
  const [etablissement, setEtablissement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'finance' | 'presence' | 'achats'>('finance');
  const [loading, setLoading] = useState(true);

  // Data States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [presents, setPresents] = useState<any[]>([]);
  const [achats, setAchats] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    // Vérifier l'utilisateur authentifié sur ce poste
    const storedUser = localStorage.getItem('temp_auth_user');
    if (!storedUser) {
        toast.error("Veuillez vous identifier");
        navigate(`/poste/${etablissementId}`);
        return;
    }

    const user = JSON.parse(storedUser);
    if ((user.role !== 'gerant' && user.role !== 'admin' && user.role !== 'client_admin') || user.etablissement_id !== etablissementId) {
      toast.error("Accès non autorisé");
      navigate(`/poste/${etablissementId}`);
      return;
    }

    setEmploye(user);
    
    const fetchEtab = async () => {
      const etabSnap = await getDoc(doc(db, 'etablissements', etablissementId!));
      if (etabSnap.exists()) {
        setEtablissement({ id: etabSnap.id, ...etabSnap.data() });
      }
      setLoading(false);
    };

    fetchEtab();
    initialiserTempsReel(etablissementId!);
  }, [etablissementId, navigate, initialiserTempsReel]);

  // Real-time Listeners
  useEffect(() => {
    if (!etablissementId) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', today.toISOString())
    );
    const unsubTrans = onSnapshot(
      qTrans, 
      (snap) => {
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("transactions_pos error:", err.message)
    );

    const qPresence = query(
      collection(db, 'pointage_presence'),
      where('etablissement_id', '==', etablissementId),
      where('statut', 'in', ['present', 'pause'])
    );
    const unsubPresence = onSnapshot(
      qPresence, 
      (snap) => {
        setPresents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("pointage_presence error:", err.message)
    );

    const qAchats = query(
      collection(db, 'achats'),
      where('etablissement_id', '==', etablissementId),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubAchats = onSnapshot(
      qAchats, 
      (snap) => {
        setAchats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("achats error:", err.message)
    );

    return () => { unsubTrans(); unsubPresence(); unsubAchats(); };
  }, [etablissementId]);

  const metrics = useMemo(() => {
    const caBrut = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
    const nbVentes = transactions.length;
    const depensesJour = achats.filter(a => {
        const d = new Date(a.date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).reduce((acc, a) => acc + (a.montant || 0), 0);
    
    return { caBrut, nbVentes, depensesJour, beneficeRelatif: caBrut - depensesJour };
  }, [transactions, achats]);

  if (loading) return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center">
       <Loader2 className="animate-spin text-white" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-800">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header Executive */}
      <header className="bg-[#1E3A8A] text-white pt-12 pb-32 px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
              <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-blue-100 text-[10px] font-bold uppercase tracking-widest border border-white/10">
                      <Shield size={14} className="text-[#FF7A00]" />
                      Console Gérant — Mode Terminal
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                     {etablissement?.nom}
                  </h1>
                  <p className="text-blue-200/60 font-bold text-sm uppercase tracking-widest">
                    Supervision temps réel : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
              </div>

              <div className="flex gap-4">
                  <button onClick={() => navigate(`/poste/${etablissementId}`)} className="h-14 px-8 bg-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3 border border-white/10">
                    <ArrowLeft size={18} /> Retour Poste
                  </button>
                  <button onClick={() => { localStorage.removeItem('temp_auth_user'); navigate(`/poste/${etablissementId}`); }} className="h-14 px-8 bg-[#FF7A00] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-3 shadow-xl shadow-orange-900/20">
                    <LogOut size={18} /> Quitter
                  </button>
              </div>
          </div>
      </header>

      {/* Metrics Row */}
      <div className="max-w-7xl mx-auto px-8 -mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
          {[
            { label: 'Chiffre d\'Affaires', value: `${metrics.caBrut.toLocaleString()} XAF`, icon: <TrendingUp size={24} />, color: 'text-emerald-500', bg: 'bg-white' },
            { label: 'Dépenses du Jour', value: `${metrics.depensesJour.toLocaleString()} XAF`, icon: <TrendingDown size={24} />, color: 'text-rose-500', bg: 'bg-white' },
            { label: 'Ventes Clôturées', value: metrics.nbVentes, icon: <ShoppingBag size={24} />, color: 'text-[#1E3A8A]', bg: 'bg-white' },
            { label: 'Effectif Présent', value: presents.length, icon: <Users size={24} />, color: 'text-[#FF7A00]', bg: 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20' },
          ].map((m, i) => (
            <div key={i} className={`${m.bg} p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-between group transition-all hover:-translate-y-1`}>
                <div className={`w-12 h-12 ${i === 3 ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                    {m.icon}
                </div>
                <div>
                   <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${i === 3 ? 'text-white/40' : 'text-slate-400'}`}>{m.label}</p>
                   <p className={`text-2xl font-black tracking-tight ${i === 3 ? 'text-white' : m.color}`}>{m.value}</p>
                </div>
            </div>
          ))}
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-8 mt-12 flex justify-center">
          <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex gap-2">
              {[
                { id: 'finance', label: 'Finance Live', icon: <Wallet size={18} /> },
                { id: 'presence', label: 'Présence Équipe', icon: <Users size={18} /> },
                { id: 'achats', label: 'Achats Récurrents', icon: <ShoppingBag size={18} /> }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                    ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-[#1E3A8A]'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
          </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-8 py-12">
          {activeTab === 'finance' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-10 duration-700">
               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-100">
                  <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Dernières Ventes</h3>
                      <Receipt className="text-slate-200" size={32} />
                  </div>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((t, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100 hover:bg-blue-50 transition-colors">
                        <div>
                          <p className="font-bold text-[#1E3A8A] uppercase text-sm">{t.methodePaiement || 'Espèces'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(t.date).toLocaleTimeString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[#1E3A8A]">{(t.total || 0).toLocaleString()} <span className="text-[10px] opacity-30 font-bold">XAF</span></p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servi par {t.serveurNom?.split(' ')[0]}</p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && <div className="p-20 text-center text-slate-200 font-bold uppercase tracking-widest text-xs">Aucune vente aujourd'hui</div>}
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col justify-center items-center text-center">
                  <div className="w-24 h-24 bg-blue-50 text-[#1E3A8A] rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                      <Landmark size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter mb-4">Solde de Session</h3>
                  <p className="text-5xl font-black text-[#FF7A00] tracking-tighter mb-8">{(metrics.caBrut).toLocaleString()} <span className="text-xl font-bold opacity-30">XAF</span></p>
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Moyenne / Ticket</p>
                          <p className="text-xl font-black text-[#1E3A8A]">{metrics.nbVentes > 0 ? Math.floor(metrics.caBrut / metrics.nbVentes).toLocaleString() : 0} <span className="text-[10px]">XAF</span></p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items Vendus</p>
                          <p className="text-xl font-black text-[#1E3A8A]">{transactions.reduce((acc, t) => acc + (t.articles?.length || 0), 0)} <span className="text-[10px]">Pcs</span></p>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'presence' && (
            <div className="bg-white p-10 md:p-16 rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 animate-in slide-in-from-right duration-700">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-2 h-10 bg-emerald-500 rounded-full" />
                   <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">Personnel Actuellement en Service</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {presents.map((p, i) => (
                        <div key={i} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 group hover:bg-white transition-all hover:shadow-lg">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                              {p.statut === 'pause' ? '☕' : '👤'}
                           </div>
                           <div>
                              <p className="text-lg font-black text-[#1E3A8A] tracking-tight leading-none mb-2">{p.employe_nom}</p>
                              <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${p.statut === 'pause' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{p.statut === 'pause' ? 'En Pause' : 'En Poste'}</span>
                              </div>
                              <p className="text-[10px] text-slate-300 font-bold uppercase mt-2">Depuis {new Date(p.debut?.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                           </div>
                        </div>
                    ))}
                    {presents.length === 0 && (
                        <div className="col-span-full p-20 text-center">
                            <Users size={64} className="mx-auto text-slate-100 mb-6" />
                            <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Aucun employé n'a pointé son arrivée</p>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'achats' && (
            <div className="bg-white p-10 md:p-16 rounded-[3.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 animate-in slide-in-from-left duration-700">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-6">
                      <div className="w-2 h-10 bg-[#FF7A00] rounded-full" />
                      <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">Registre des Achats du Jour</h3>
                   </div>
                   <button onClick={() => navigate('/tableau-de-bord/achats')} className="text-xs font-bold text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2 hover:opacity-70">
                      Gérer l'inventaire <ArrowRight size={14} />
                   </button>
                </div>
                <div className="space-y-4">
                    {achats.map((a, i) => (
                        <div key={i} className="bg-slate-50 p-8 rounded-[2rem] flex justify-between items-center border border-slate-100 hover:bg-orange-50/30 transition-all">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#FF7A00] shadow-sm"><Package size={24} /></div>
                              <div>
                                 <p className="text-lg font-black text-[#1E3A8A] tracking-tight leading-none mb-1 uppercase">{a.article || 'Achat divers'}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(a.date).toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black text-[#FF7A00] tracking-tighter">{(a.montant || 0).toLocaleString()} <span className="text-xs font-bold opacity-30">XAF</span></p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enregistré par {a.responsable?.split(' ')[0] || 'Admin'}</p>
                           </div>
                        </div>
                    ))}
                    {achats.length === 0 && (
                        <div className="p-20 text-center">
                            <ShoppingBag size={64} className="mx-auto text-slate-100 mb-6" />
                            <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Aucun achat enregistré aujourd'hui</p>
                        </div>
                    )}
                </div>
            </div>
          )}
      </main>

      {/* Action Floating Buttons (Simulated for this terminal mode) */}
      <div className="fixed bottom-10 right-10 flex gap-4">
          <button className="w-16 h-16 bg-white text-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/10 border border-slate-100 hover:scale-110 transition-all">
             <Filter size={24} />
          </button>
          <button className="w-16 h-16 bg-[#1E3A8A] text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/20 hover:scale-110 transition-all">
             <Plus size={32} />
          </button>
      </div>
    </div>
  );
};

export default PageTerminalManager;
