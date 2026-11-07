import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, CreditCard, 
  FileText, Calendar, Filter, ArrowUpRight, 
  ArrowDownRight, PieChart as PieChartIcon, 
  ShieldCheck, Calculator, Activity, ArrowRight, X, Download,
  Wallet, ShoppingCart, Users, AlertCircle, History, Receipt, Trash2, Search, RefreshCcw,
  Sparkles, TrendingDown, Landmark, ReceiptText, Smartphone, Phone
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc 
} from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ModalRapportFiscal from '../../components/modals/ModalRapportFiscal';
import { aggregateFinancials, buildDailyFinancialSeries, expenseAmount, invoicedAmount, receivedAmount } from '../../lib/finance';

interface Transaction {
  id: string;
  total: number;
  montantRecu: number;
  montantRestant: number;
  modePaiement: 'comptant' | 'credit';
  clientNom?: string;
  clientContact?: string;
  type: 'sur_place' | 'a_emporter' | 'depense';
  description?: string;
  date: string;
  serveurNom?: string;
  tableNom?: string;
  commandeId?: string;
}

const GestionFinance = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'journal' | 'dettes' | 'charges' | 'recurrentes'>('journal');
  const [charges, setCharges] = useState<{id: string, montant: number, motif: string, date: string}[]>([]);
  const [chargesRecurrentes, setChargesRecurrentes] = useState<{id: string, montant: number, motif: string}[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showRecurenteModal, setShowRecurenteModal] = useState(false);
  const [nouveauMontantCharge, setNouveauMontantCharge] = useState('');
  const [nouveauMotifCharge, setNouveauMotifCharge] = useState('');
  const [clientRecherche, setClientRecherche] = useState('');
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [configEtab, setConfigEtab] = useState<any>(null);

  useEffect(() => {
    if (!etablissementId) return;
    const fetchConfig = async () => {
      const snap = await getDoc(doc(db, 'etablissements', etablissementId));
      if (snap.exists()) setConfigEtab(snap.data());
    };
    fetchConfig();
  }, [etablissementId]);

  useEffect(() => {
    if (!etablissementId) {
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'transactions_pos'), where('etablissement_id', '==', etablissementId));
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
        setTransactions(data.sort((a,b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        }));
        setLoading(false);
      },
      (err) => {
        console.warn("transactions_pos error:", err.message);
        setLoading(false);
      }
    );

    const qCharges = query(collection(db, 'charges_fixes'), where('etablissement_id', '==', etablissementId));
    const unsubCharges = onSnapshot(
      qCharges, 
      (snap) => {
        setCharges(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]);
      },
      (err) => console.warn("charges_fixes error:", err.message)
    );

    const qRecur = query(collection(db, 'charges_recurrentes'), where('etablissement_id', '==', etablissementId));
    const unsubRecur = onSnapshot(
      qRecur, 
      (snap) => {
        setChargesRecurrentes(snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]);
      },
      (err) => console.warn("charges_recurrentes error:", err.message)
    );

    return () => { unsub(); unsubCharges(); unsubRecur(); };
  }, [etablissementId]);

  const ajouterCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMontantCharge || !nouveauMotifCharge) return;
    try {
      await addDoc(collection(db, 'charges_fixes'), {
        montant: Number(nouveauMontantCharge),
        motif: nouveauMotifCharge,
        date: new Date().toISOString(),
        etablissement_id: etablissementId
      });
      toast.success("Charge enregistrée");
      setNouveauMontantCharge(''); setNouveauMotifCharge(''); setShowChargeModal(false);
    } catch { toast.error("Erreur système"); }
  };

  const ajouterChargeRecurrente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMontantCharge || !nouveauMotifCharge) return;
    try {
      await addDoc(collection(db, 'charges_recurrentes'), {
        montant: Number(nouveauMontantCharge),
        motif: nouveauMotifCharge,
        etablissement_id: etablissementId
      });
      toast.success("Charge récurrente activée");
      setNouveauMontantCharge(''); setNouveauMotifCharge(''); setShowRecurenteModal(false);
    } catch { toast.error("Erreur système"); }
  };

  const supprimerCharge = async (id: string, collectionName: string = 'charges_fixes') => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Enregistrement supprimé");
    } catch { toast.error("Erreur système"); }
  };

  const encaisserDette = async (transactionId: string, montant: number, mode: 'comptant' | 'mobile' = 'comptant', ref: string = '') => {
    try {
      const trans = transactions.find(t => t.id === transactionId);
      if (!trans) return;

      const totalFacture = invoicedAmount(trans) || Number(trans.total) || 0;
      const dejaRecu = receivedAmount(trans);
      const nouveauRecu = dejaRecu + montant;
      const nouveauRestant = Math.max(0, totalFacture - nouveauRecu);

      const docRef = doc(db, 'transactions_pos', transactionId);
      await updateDoc(docRef, {
        montantRecu: nouveauRecu,
        montantRestant: nouveauRestant,
        modePaiement: nouveauRestant <= 0 ? 'comptant' : 'credit',
        dernierModePaiement: mode,
        derniereRefMobile: ref || null
      });

      // On crée une petite transaction de trace pour la comptabilité
      await addDoc(collection(db, 'transactions_pos'), {
        commandeId: trans.commandeId || trans.id,
        etablissement_id: etablissementId,
        montant: montant,
        type: 'recouvrement',
        modePaiement: mode,
        refPaiement: ref || null,
        clientNom: trans.clientNom,
        date: new Date().toISOString()
      });

      toast.success(`Recouvrement enregistré : ${montant.toLocaleString()} XAF (${mode.toUpperCase()})`);
    } catch (error) {
      toast.error("Erreur système");
      console.error(error);
    }
  };

  const relancerWhatsApp = (t: Transaction) => {
    if (!t.clientContact) return;
    const message = `Bonjour ${t.clientNom || 'Cher client'}, nous vous rappelons que votre ardoise chez ${profil?.etablissement_nom || 'notre établissement'} s'élève à ${t.montantRestant?.toLocaleString()} XAF. Vous pouvez régler par Mobile Money. Merci !`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${t.clientContact.replace(/\s/g, '')}?text=${encoded}`, '_blank');
  };

  const totalChargesPonctuelles = charges.reduce((acc, c) => acc + c.montant, 0);
  const totalChargesRecurrentes = chargesRecurrentes.reduce((acc, c) => acc + c.montant, 0);
  const totalCharges = totalChargesPonctuelles + totalChargesRecurrentes;
  const totaux = useMemo(() => aggregateFinancials(transactions, totalCharges), [transactions, totalCharges]);
  const totalEncaisse = totaux.encaisse;
  const dettesClients = totaux.dettes;
  const depensesAchats = totaux.depenses - totalCharges;
  const resultatNet = totaux.resultat;

  const transactionsDettes = transactions.filter(t => (t.montantRestant || 0) > 0);

  const chartData = useMemo(() => buildDailyFinancialSeries(transactions, 7), [transactions]);

  const genererRapportPDF = () => {
    const docPdf = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR');
    docPdf.setFontSize(22); docPdf.setTextColor(30, 58, 138); docPdf.text("GESTCAVE PRO - FINANCE", 14, 20);
    docPdf.setFontSize(10); docPdf.setTextColor(100, 116, 139); docPdf.text(`Rapport Financier (${profil?.nom || 'Admin'}) - ${date}`, 14, 28);
    
    autoTable(docPdf, {
      startY: 40,
      head: [['DATE', 'OPÉRATION', 'ENTITÉ', 'PAIEMENT', 'ENTRÉE', 'SORTIE']],
      body: transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.type === 'depense' ? 'ACHAT' : 'VENTE',
        (t.clientNom || t.tableNom || t.description || 'COMPTOIR').toUpperCase(),
        t.modePaiement?.toUpperCase() || 'COMPTANT',
        t.type !== 'depense' ? `${receivedAmount(t).toLocaleString()} XAF` : '-',
        t.type === 'depense' ? `${expenseAmount(t).toLocaleString()} XAF` : '-'
      ]),
      headStyles: { fillColor: [30, 58, 138], fontSize: 8 }, 
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 7, font: 'helvetica' }
    });

    let currentY = (docPdf as any).lastAutoTable.finalY + 15;
    
    if (charges.length > 0) {
        docPdf.setFontSize(10); docPdf.setTextColor(255, 122, 0); docPdf.text("CHARGES & FRAIS", 14, currentY);
        autoTable(docPdf, {
            startY: currentY + 5,
            head: [['DATE', 'MOTIF', 'MONTANT']],
            body: charges.map(c => [new Date(c.date).toLocaleDateString(), c.motif.toUpperCase(), `${(c.montant || 0).toLocaleString()} XAF`]),
            headStyles: { fillColor: [255, 122, 0] },
            styles: { fontSize: 7 }
        });
        currentY = (docPdf as any).lastAutoTable.finalY + 15;
    }

    docPdf.setFontSize(10); docPdf.setTextColor(30, 58, 138);
    docPdf.text(`TOTAL ENCAISSÉ : ${(totalEncaisse || 0).toLocaleString()} XAF`, 14, currentY);
    docPdf.text(`TOTAL ACHATS : -${(depensesAchats || 0).toLocaleString()} XAF`, 14, currentY + 7);
    docPdf.text(`TOTAL CHARGES : -${(totalCharges || 0).toLocaleString()} XAF`, 14, currentY + 14);
    
    docPdf.setFontSize(14); docPdf.setTextColor(255, 122, 0);
    docPdf.text(`BÉNÉFICE NET : ${(resultatNet || 0).toLocaleString()} XAF`, 14, currentY + 28);

    docPdf.save(`Rapport_Financier_${date}.pdf`);
    toast.success("Rapport PDF généré");
  };

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Analyse financière...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Landmark size={14} />
              Trésorerie & Finance
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Gestion de <span className="text-[#FF7A00]">Trésorerie</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Contrôlez vos flux de revenus, vos charges et la rentabilité nette.</p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
            <button onClick={() => setShowChargeModal(true)} className="px-6 py-4 bg-white border border-slate-200 text-[#1E3A8A] rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
              <Calculator size={18} /> Charge ponctuelle
            </button>
            <button onClick={() => setShowRecurenteModal(true)} className="px-6 py-4 bg-white border border-slate-200 text-[#1E3A8A] rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCcw size={18} /> Charge récurrente
            </button>
            <button onClick={genererRapportPDF} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
              <Download size={18} /> Exporter PDF
            </button>
            <button onClick={() => setShowFiscalModal(true)} className="px-6 py-4 bg-[#FF7A00] text-white rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20">
              <Activity size={18} /> Bilan Fiscal
            </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-6"><TrendingUp size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Chiffre d'Affaires</p>
            <p className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">{(totalEncaisse || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF7A00] mb-6"><AlertCircle size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dettes Clients</p>
            <p className="text-3xl font-extrabold text-[#FF7A00] tracking-tight">{(dettesClients || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6"><TrendingDown size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Achats</p>
            <p className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">{(depensesAchats || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className={`p-8 rounded-[2rem] shadow-xl transition-all group hover:scale-[1.02] relative overflow-hidden ${resultatNet >= 0 ? 'bg-emerald-500 shadow-emerald-900/20' : 'bg-rose-500 shadow-rose-900/20'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6"><PieChartIcon size={24} /></div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Bénéfice Net</p>
            <p className="text-3xl font-extrabold text-white tracking-tight">{(resultatNet || 0).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
          {[
            { id: 'journal', label: 'Journal des Flux', icon: <History size={16} /> },
            { id: 'dettes', label: 'Crédits & Dettes', icon: <Users size={16} /> },
            { id: 'charges', label: 'Charges Ponctuelles', icon: <Receipt size={16} /> },
            { id: 'recurrentes', label: 'Charges Fixes', icon: <RefreshCcw size={16} /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-[#1E3A8A] hover:bg-white'}`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'dettes' && dettesClients > 0 && (
                <span className="bg-[#FF7A00] text-white px-2 py-0.5 rounded-full text-[9px]">{transactionsDettes.length}</span>
              )}
            </button>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-10">
        {activeTab === 'journal' ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                  <div className="flex justify-between items-center mb-12">
                      <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] tracking-tight">Performance 7 Jours</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Volume des ventes quotidiennes</p>
                      </div>
                      <div className="p-3 bg-blue-50 text-[#1E3A8A] rounded-2xl">
                         <Activity size={24} />
                      </div>
                  </div>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dx={-15} />
                        <Tooltip 
                          contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px'}}
                          itemStyle={{fontWeight: 800, color: '#1E3A8A', fontSize: '14px'}}
                          cursor={{stroke: '#1E3A8A', strokeWidth: 2, strokeDasharray: '4 4'}}
                        />
                        <Area type="monotone" dataKey="encaisse" name="Encaisse" stroke="#1E3A8A" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="depenses" name="Depenses" stroke="#F43F5E" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white relative flex flex-col justify-between shadow-2xl shadow-blue-900/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#FF7A00] mb-8 border border-white/10 shadow-inner">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-6 leading-tight">Santé de la Trésorerie</h3>
                        <p className="text-blue-100/60 text-sm font-medium leading-relaxed mb-10">L'intégrité de vos flux est actuellement optimale. Toutes les transactions sont tracées et sécurisées.</p>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <TrendingUp size={20} className="text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Liquidités</p>
                                    <p className="text-[10px] text-white/40 uppercase font-medium">Positions vérifiées sur tous les postes.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <ReceiptText size={20} className="text-orange-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">Passifs</p>
                                    <p className="text-[10px] text-white/40 uppercase font-medium">Dettes fournisseurs sous contrôle.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                            <span>Marge Opérationnelle</span>
                            <span className="text-[#FF7A00]">{totalEncaisse > 0 ? Math.round((resultatNet / totalEncaisse) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div style={{ width: `${totalEncaisse > 0 ? Math.min(100, (resultatNet / totalEncaisse) * 100) : 0}%` }} className="h-full bg-[#FF7A00] rounded-full shadow-lg shadow-orange-900/50" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Journal des Transactions</h3>
                    <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 w-full md:w-auto">
                        <Search size={18} className="text-slate-300" />
                        <input 
                          type="text" 
                          placeholder="Rechercher une transaction..." 
                          className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest w-full md:w-64 text-[#1E3A8A] placeholder:text-slate-300"
                          value={clientRecherche}
                          onChange={(e) => setClientRecherche(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400">
                            <tr>
                                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Opération</th>
                                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Entité / Motif</th>
                                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Flux</th>
                                <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Volume</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions
                              .filter(t => !clientRecherche || (t.clientNom?.toLowerCase().includes(clientRecherche.toLowerCase()) || t.description?.toLowerCase().includes(clientRecherche.toLowerCase())))
                              .map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'depense' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {t.type === 'depense' ? <ShoppingCart size={20} /> : <Receipt size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#1E3A8A] tracking-tight">{t.type === 'depense' ? 'ACHAT' : 'VENTE'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="font-bold text-slate-600 text-sm">{t.clientNom || t.tableNom || t.description || 'COMPTOIR'}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${t.type === 'depense' ? 'text-rose-500 bg-rose-50 border-rose-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100'}`}>
                                            {t.type === 'depense' ? 'SORTIE' : 'ENTRÉE'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <p className={`font-black text-xl tracking-tighter ${t.type === 'depense' ? 'text-rose-500' : 'text-[#1E3A8A]'}`}>
                                          {t.type === 'depense' ? '-' : '+'}{(t.type === 'depense' ? expenseAmount(t) : receivedAmount(t)).toLocaleString()} <span className="text-[10px] opacity-30">XAF</span>
                                        </p>
                                        {(t.montantRestant || 0) > 0 && <p className="text-[10px] font-bold text-[#FF7A00] uppercase mt-1 tracking-widest">Dette : {(t.montantRestant || 0).toLocaleString()}</p>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        ) : activeTab === 'dettes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-10 duration-500">
              {transactionsDettes.length === 0 ? (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-500">
                       <ShieldCheck size={64} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#1E3A8A] tracking-tight">Aucun Crédit En Cours</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Toutes les positions sont soldées.</p>
                </div>
              ) : (
                transactionsDettes.map(t => (
                  <div key={t.id} className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl shadow-blue-900/5 relative overflow-hidden group hover:border-orange-200 transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-3xl -mr-12 -mt-12 opacity-50" />
                      
                      <div className="flex justify-between items-start mb-8 relative z-10">
                          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF7A00] shadow-inner">
                              <Users size={32} />
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solde dû</p>
                              <p className="text-3xl font-black text-[#FF7A00] tracking-tighter mt-1">{(t.montantRestant || 0).toLocaleString()} <span className="text-xs opacity-30">XAF</span></p>
                          </div>
                      </div>

                      <div className="space-y-6 mb-10 relative z-10">
                          <div>
                              <h4 className="font-extrabold text-[#1E3A8A] text-xl tracking-tight uppercase">{t.clientNom || 'CLIENT INCONNU'}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-3">
                                  <Calendar size={14} /> Depuis le {new Date(t.date).toLocaleDateString()}
                              </p>
                          </div>
                          {t.clientContact && (
                              <div className="flex items-center gap-3 text-[10px] font-bold text-[#1E3A8A] bg-blue-50 px-4 py-2 rounded-xl w-fit uppercase tracking-widest">
                                  <Smartphone size={14} /> {t.clientContact}
                              </div>
                          )}
                      </div>

                      <div className="pt-8 border-t border-slate-100 grid grid-cols-1 gap-3 relative z-10">
                          <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => {
                                  const mode = window.confirm("Payer par Mobile Money ? (Annuler pour Espèces)") ? 'mobile' : 'comptant';
                                  let ref = '';
                                  if (mode === 'mobile') {
                                    ref = prompt("RÉFÉRENCE DE LA TRANSACTION MOBILE MONEY ?") || '';
                                    if (!ref) return;
                                  }
                                  encaisserDette(t.id, t.montantRestant!, mode, ref);
                                }}
                                className="h-14 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10"
                              >
                                Tout solder
                              </button>
                              <button 
                                onClick={() => {
                                  const m = prompt("MONTANT DU VERSEMENT PARTIEL (XAF) ?");
                                  if (!m) return;
                                  const mode = window.confirm("Payer par Mobile Money ?") ? 'mobile' : 'comptant';
                                  let ref = '';
                                  if (mode === 'mobile') {
                                    ref = prompt("RÉFÉRENCE MOBILE MONEY ?") || '';
                                  }
                                  encaisserDette(t.id, parseInt(m), mode, ref);
                                }}
                                className="h-14 bg-white border border-slate-200 text-[#1E3A8A] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                              >
                                Versement
                              </button>
                          </div>
                          
                          {t.clientContact && (
                            <button 
                              onClick={() => relancerWhatsApp(t)}
                              className="h-14 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center gap-2"
                            >
                              <Phone size={14} /> Relancer par WhatsApp
                            </button>
                          )}
                      </div>
                  </div>
                ))
              )}
          </div>
        ) : activeTab === 'recurrentes' ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-[#1E3A8A] p-10 md:p-16 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
               
               <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                 <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Protocoles Récurrents</h3>
                 <p className="text-blue-100/60 text-sm font-medium uppercase tracking-widest max-w-sm">Dépenses fixes prévisibles déduites mensuellement.</p>
               </div>
               <div className="text-center md:text-right relative z-10">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Volume Mensuel Prévu</p>
                  <p className="text-6xl font-black tracking-tighter">{(totalChargesRecurrentes || 0).toLocaleString()} <span className="text-2xl opacity-30">XAF</span></p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chargesRecurrentes.map(c => (
                  <div key={c.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex justify-between items-center group shadow-xl shadow-blue-900/5 hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-inner group-hover:bg-blue-100 transition-colors">
                          <RefreshCcw size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1E3A8A] text-sm uppercase tracking-tight">{c.motif}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Protocole Actif</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <p className="font-black text-[#1E3A8A] text-xl tracking-tighter">{(c.montant || 0).toLocaleString()} <span className="text-xs opacity-20 font-bold uppercase">XAF</span></p>
                        <button onClick={() => supprimerCharge(c.id, 'charges_recurrentes')} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                           <Trash2 size={20} />
                        </button>
                      </div>
                  </div>
                ))}
                {chargesRecurrentes.length === 0 && (
                   <div className="col-span-full py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">Aucun protocole récurrent actif.</div>
                )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden animate-in fade-in duration-500">
              <div className="p-8 border-b border-slate-100">
                  <h3 className="text-lg font-extrabold text-[#1E3A8A] uppercase tracking-tight">Registre des Charges Ponctuelles</h3>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400">
                          <tr>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Date Enregistrement</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Nature du Motif</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Montant</th>
                              <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {charges.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                                  <td className="px-10 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                      {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </td>
                                  <td className="px-10 py-6">
                                      <p className="font-bold text-[#1E3A8A] text-sm uppercase tracking-tight">{c.motif}</p>
                                  </td>
                                  <td className="px-10 py-6 font-black text-[#FF7A00] text-xl tracking-tighter">
                                      -{(c.montant || 0).toLocaleString()} <span className="text-[10px] opacity-30">XAF</span>
                                  </td>
                                  <td className="px-10 py-6 text-right">
                                      <button onClick={() => supprimerCharge(c.id)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                          <Trash2 size={20} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {charges.length === 0 && (
                              <tr>
                                  <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Aucune charge ponctuelle enregistrée.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showChargeModal || showRecurenteModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => { setShowChargeModal(false); setShowRecurenteModal(false); }} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="w-full max-w-xl bg-white p-12 md:p-16 rounded-[3.5rem] relative shadow-2xl animate-in zoom-in-95 duration-500 border border-white/20">
            <button onClick={() => { setShowChargeModal(false); setShowRecurenteModal(false); }} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                  Protocole Financier
                </div>
                <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight">
                  {showRecurenteModal ? 'Charge Récurrente' : 'Dépense Ponctuelle'}
                </h3>
            </div>
            <form onSubmit={showRecurenteModal ? ajouterChargeRecurrente : ajouterCharge} className="space-y-8">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Designation du Motif</label>
                <input type="text" value={nouveauMotifCharge} onChange={(e) => setNouveauMotifCharge(e.target.value)} required placeholder="Ex: Loyer, Electricité, Maintenance..."
                  className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] placeholder:text-slate-200 shadow-sm" />
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 text-center">Montant de la charge (XAF)</label>
                <input type="number" value={nouveauMontantCharge} onChange={(e) => setNouveauMontantCharge(e.target.value)} required placeholder="0"
                  className="w-full text-center text-5xl font-black text-[#FF7A00] bg-transparent outline-none tracking-tighter" />
              </div>
              <button type="submit" className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] text-sm font-bold uppercase tracking-widest hover:bg-blue-800 transition-all mt-6 shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-4">
                {showRecurenteModal ? 'Activer le Protocole' : 'Valider la Dépense'} <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      <ModalRapportFiscal 
        isOpen={showFiscalModal} 
        onClose={() => setShowFiscalModal(false)} 
        defaultCA={totalEncaisse} 
        configEtab={configEtab}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionFinance;
