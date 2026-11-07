import React, { useState, useMemo, useEffect } from 'react';

import { 
  Banknote, CreditCard, Smartphone, Receipt, 
  CheckCircle2, Users, Clock, ShoppingBag, Wine,
  LogOut, ArrowRight, ShieldCheck, Wallet, 
  TrendingUp, History as HistoryIcon, User, X, Info, Calculator, ArrowLeft, ChevronLeft,
  History, Zap, Phone, UserPlus, AlertCircle, Search,
  Lock, Unlock, ShieldAlert, Sparkles, Printer, ArrowDownRight, CreditCard as CardIcon,
  Check, MoreVertical, LayoutDashboard, Database, Landmark, DollarSign, Plus, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePOSStore, imprimerTicket } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useNavigate } from 'react-router-dom';
import type { LigneCommande } from '../../store/posStore';
import { db } from '../../lib/firebase';


const InterfaceCaissier = () => {
  const { profil } = useAuthStore();
  const isAdmin = profil?.role === 'client_admin' || profil?.role === 'super_admin';
  const { 
    tables, commandes, encaisserCommande, ouvrirVenteEmporter,
    sessionActive, ouvrirSession, fermerSession, enregistrerAcompte, mettreEnArriere,
    historiqueSessions, initPOS, etablissement_id: posEtabId
  } = usePOSStore();
  const { nomEmploye, idEmploye, etablissementId, quitterPoste } = usePosteSession();
  const navigate = useNavigate();

  // CRITIQUE: Auto-initialiser le store quand la caisse est accédée directement
  useEffect(() => {
    const etabId = etablissementId || profil?.etablissement_id;
    if (etabId && !posEtabId) {
      initPOS(etabId);
    }
  }, [etablissementId, profil?.etablissement_id, posEtabId, initPOS]);

  // GARDE FOU : Si on accède sans identification poste, retour au terminal
  useEffect(() => {
    if (!idEmploye || idEmploye === 'inconnu') {
      const etabId = etablissementId || profil?.etablissement_id;
      if (etabId) navigate(`/poste/${etabId}`);
      else navigate('/choisir-role');
    }
  }, [idEmploye, etablissementId, profil?.etablissement_id, navigate]);
  
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState<'especes' | 'mobile' | 'carte' | 'credit' | null>(null);
  const [montantSaisi, setMontantSaisi] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [contactClient, setContactClient] = useState('');
  const [remise, setRemise] = useState(0);
  const [refPaiement, setRefPaiement] = useState('');
  
  const [showOuvertureModal, setShowOuvertureModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [fondsSaisi, setFondsSaisi] = useState('0');
  const [datePromesse, setDatePromesse] = useState('');

  // Stats en temps réel : calcul direct depuis sessionActive (mis à jour par les increment() dans encaisserCommande)
  const statsSession = useMemo(() => {
    if (!sessionActive) return { totalEncaisse: 0, totalDettes: 0, nbTransactions: 0 };
    const especes = (sessionActive as any).totalEspeces || 0;
    const mobile = (sessionActive as any).totalMobile || 0;
    const carte = (sessionActive as any).totalCarte || 0;
    const credit = (sessionActive as any).totalCredit || 0;
    const totalEncaisse = especes + mobile + carte; // Le crédit n'est pas encaissé, c'est une dette
    const totalDettes = credit;
    return { totalEncaisse, totalDettes, nbTransactions: commandes.filter(c => c.statut === 'payee' || c.statut === 'en_arriere').length };
  }, [commandes, sessionActive]);

  const soldeTheoriqueCloture = useMemo(() => {
    if (!sessionActive) return 0;
    return (Number(sessionActive.fondsInitial) || 0) + (Number((sessionActive as any).totalEspeces) || 0);
  }, [sessionActive]);

  const fondAttendu = useMemo(() => {
    if (!historiqueSessions || historiqueSessions.length === 0) return 0;
    const closedSessions = [...historiqueSessions].filter(s => s.statut === 'fermee');
    if (closedSessions.length === 0) return 0;
    const derniereSession = closedSessions.sort((a, b) => new Date(b.dateFermeture || 0).getTime() - new Date(a.dateFermeture || 0).getTime())[0];
    return derniereSession.fondsFinalSaisi || 0;
  }, [historiqueSessions]);

  React.useEffect(() => {
    if (!sessionActive) {
      setFondsSaisi(fondAttendu.toString());
    }
  }, [sessionActive, fondAttendu]);

  const [searchQuery, setSearchQuery] = useState('');
  const [vueActive, setVueActive] = useState<'actives' | 'arrieres'>('actives');

  const commandesActives = useMemo(() => {
    return commandes
      .filter(c => vueActive === 'actives' 
        ? (c.statut !== 'payee' && c.statut !== 'en_arriere' && (c.total || 0) > 0) 
        : c.statut === 'en_arriere'
      )
      .filter(c => 
        (c.tableNom || 'DIRECTE').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.serveurNom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.clientNom || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [commandes, searchQuery, vueActive]);

  const commandeActive = commandes.find(c => c.id === commandeSelectionnee);
  
  const totalNet = Math.max(0, (commandeActive?.total || 0) - remise);
  const dejaPaye = Number(commandeActive?.montantPaye || 0);
  const montantRecu = parseFloat(montantSaisi) || 0;
  
  const resteAPayer = Math.max(0, totalNet - dejaPaye - montantRecu);
  const monnaieRendue = (modePaiement === 'especes' && (montantRecu + dejaPaye) > totalNet) 
    ? (montantRecu + dejaPaye) - totalNet 
    : 0;

  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    
    commandeActive.lignes.forEach(ligne => {
      const key = ligne.heureEnvoi || 'en_attente';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ligne);
    });

    return Object.entries(groups).map(([time, items]) => ({
      time: time === 'en_attente' ? null : time,
      items,
      total: items.reduce((sum, item) => sum + (Number(item.sousTotal) || 0), 0)
    })).sort((a, b) => {
      if (!a.time) return -1;
      if (!b.time) return 1;
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
  }, [commandeActive]);

  const finaliserPaiement = async () => {
    if (!commandeSelectionnee || !modePaiement) return;
    
    if ((modePaiement === 'credit' || resteAPayer > 0) && (!nomClient || !contactClient)) {
      toast.error('Identité du client requise pour le crédit');
      return;
    }

    if (modePaiement === 'especes' && montantRecu === 0 && dejaPaye === 0) {
      toast.error('Veuillez saisir le montant reçu');
      return;
    }

    const toastId = toast.loading("Enregistrement de la transaction...");
    try {
      await encaisserCommande(
        commandeSelectionnee, 
        modePaiement, 
        nomClient, 
        remise, 
        montantRecu + dejaPaye, 
        contactClient,
        refPaiement
      );
      
      imprimerTicket(commandeActive!, profil?.etablissement_nom || 'GESTCAVE PRO');
      
      toast.success("Vente clôturée et ticket imprimé", { id: toastId });
      setCommandeSelectionnee(null);
      setModePaiement(null);
      setMontantSaisi('');
      setNomClient('');
      setContactClient('');
      setRemise(0);
      setDatePromesse('');
    } catch (error) {
      toast.error("Erreur lors de l'encaissement", { id: toastId });
    }
  };

  const handleAcompte = async () => {
    if (!commandeSelectionnee || !modePaiement || !montantRecu) {
      toast.error("Veuillez saisir un montant et un mode de paiement");
      return;
    }
    const toastId = toast.loading("Enregistrement de l'acompte...");
    try {
      await enregistrerAcompte(commandeSelectionnee, montantRecu, modePaiement);
      toast.success("Acompte enregistré !", { id: toastId });
      setMontantSaisi('');
    } catch (error) {
      toast.error("Erreur lors de l'acompte");
    }
  };

  const relancerWhatsApp = (cmd: any) => {
    if (!cmd.clientContact) return;
    const message = `Bonjour ${cmd.clientNom || 'Cher client'}, nous vous rappelons que votre ardoise chez ${profil?.etablissement_nom || 'notre établissement'} s'élève à ${cmd.montantRestant?.toLocaleString()} XAF. Vous pouvez régler par Mobile Money au ${profil?.telephone || '[Votre Numéro]'}. Merci !`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cmd.clientContact.replace(/\s/g, '')}?text=${encoded}`, '_blank');
  };

  const handleDeconnexion = () => {
    if (sessionActive) {
      toast.error("⚠️ INTERDICTION DE DÉPART : Vous devez obligatoirement clôturer la caisse avant de vous déconnecter.", {
        duration: 6000,
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
      });
      setShowClotureModal(true);
      return;
    }
    quitterPoste();
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] text-slate-800 overflow-hidden">
      {/* Caissier Header */}
      <header className="h-24 bg-[#1E3A8A] px-10 flex items-center justify-between shadow-2xl relative z-30">
          <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-lg shadow-blue-900/20">
                      {profil?.type_etablissement === 'boutique' ? <ShoppingBag size={28} /> : <Wallet size={28} />}
                  </div>
                  <div>
                      <h1 className="text-white font-black text-xl tracking-tight uppercase leading-none">
                        {profil?.type_etablissement === 'boutique' ? 'Caisse Boutique' : 'Caisse Bar/Resto'} • <span className="text-[#FF7A00]">{nomEmploye?.split(' ')[0]}</span>
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-blue-300 font-bold text-[10px] uppercase tracking-widest">
                          Session Active • {sessionActive?.caissierNom || nomEmploye}
                        </p>
                      </div>
                  </div>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="flex gap-4">
                  <button onClick={() => ouvrirVenteEmporter(idEmploye || 'inconnu', nomEmploye || 'Caissier')} className="h-12 px-6 bg-[#FF7A00] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2">
                    <Plus size={16} /> {profil?.type_etablissement === 'boutique' ? 'Nouvelle Vente' : 'Vente Directe'}
                  </button>
                  <button onClick={() => setShowClotureModal(true)} className="h-12 px-6 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2">
                    <Lock size={16} /> Fermer Caisse
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <button onClick={handleDeconnexion} className="flex items-center gap-3 px-5 py-3 bg-rose-500/10 text-rose-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 group">
                Déconnexion <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
      </header>
      
      {/* Real-time Financial Dashboard */}
      <div className="bg-white border-b border-slate-100 px-10 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 relative z-20">
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4 group hover:bg-emerald-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <Banknote size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Encaissé</p>
                  <p className="text-2xl font-black text-[#1E3A8A] tracking-tighter">
                    {statsSession.totalEncaisse.toLocaleString()} <span className="text-xs opacity-40">F</span>
                  </p>
              </div>
          </div>
          <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex items-center gap-4 group hover:bg-rose-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                  <AlertCircle size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Dettes / Impayés</p>
                  <p className="text-2xl font-black text-[#1E3A8A] tracking-tighter">
                    {commandes.filter(c => c.statut === 'en_arriere').reduce((acc, c) => acc + (c.montantRestant || (c.total - (c.montantPaye || 0))), 0).toLocaleString()} <span className="text-xs opacity-40">F</span>
                  </p>
              </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4 group hover:bg-blue-100 transition-all">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-sm">
                  <History size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest mb-1">Ventes Latentes</p>
                  <p className="text-2xl font-black text-[#1E3A8A] tracking-tighter">
                    {commandes.filter(c => c.statut !== 'payee' && c.statut !== 'en_arriere').reduce((acc, c) => acc + ((c.total || 0) - (c.montantPaye || 0)), 0).toLocaleString()} <span className="text-xs opacity-40">F</span>
                  </p>
              </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Calculator size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                  <p className="text-2xl font-black text-[#1E3A8A] tracking-tighter">{statsSession.nbTransactions} Ops</p>
              </div>
          </div>
      </div>

      {/* Main Interface Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Orders Selection */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="p-8 pb-4">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une table, un client ou un serveur..."
                      className="w-full h-16 bg-white border border-slate-100 rounded-[1.5rem] pl-16 pr-6 outline-none focus:border-[#1E3A8A] transition-all font-bold text-[#1E3A8A] shadow-sm"
                    />
                </div>

                <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => setVueActive('actives')}
                      className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vueActive === 'actives' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                    >
                      {profil?.type_etablissement === 'boutique' ? 'Ventes en cours' : 'Sur Table / Direct'} ({commandes.filter(c => c.statut !== 'payee' && c.statut !== 'en_arriere').length})
                    </button>
                    <button 
                      onClick={() => setVueActive('arrieres')}
                      className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${vueActive === 'arrieres' ? 'bg-[#FF7A00] text-white shadow-lg shadow-orange-900/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                    >
                      Dettes / Crédits ({commandes.filter(c => c.statut === 'en_arriere').length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {commandesActives.map((cmd) => {
                        const table = tables.find(t => t.id === cmd.tableId);
                        const isDemandeAddition = table?.statut === 'en_attente_paiement';
                        
                        return (
                        <button 
                          key={cmd.id}
                          onClick={() => setCommandeSelectionnee(cmd.id)}
                          className={`p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                            vueActive === 'arrieres'
                              ? `h-auto min-h-[200px] ${commandeSelectionnee === cmd.id ? 'bg-[#FF7A00] border-[#FF7A00] text-white shadow-2xl' : 'bg-orange-50 border-orange-200 text-slate-800 hover:border-orange-400 shadow-xl shadow-orange-900/10'}`
                              : `h-64 ${commandeSelectionnee === cmd.id 
                                  ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-2xl shadow-blue-900/20' 
                                  : isDemandeAddition
                                  ? 'bg-rose-50 border-rose-400 text-slate-800 shadow-xl shadow-rose-900/10 animate-pulse'
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-100 shadow-xl shadow-blue-900/5'}`
                          }`}
                        >
                            {commandeSelectionnee === cmd.id && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
                            )}

                            {vueActive === 'arrieres' ? (
                              /* ── CARTE ARRIÉRÉ ── */
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${commandeSelectionnee === cmd.id ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-800'}`}>
                                    DETTE — {cmd.tableNom || 'DIRECTE'}
                                  </div>
                                  <span className="text-[10px] font-bold opacity-40"># {cmd.id.slice(-4).toUpperCase()}</span>
                                </div>
                                {/* Nom débiteur */}
                                <div>
                                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${commandeSelectionnee === cmd.id ? 'text-white/60' : 'text-orange-400'}`}>Débiteur</p>
                                  <h3 className={`text-xl font-black tracking-tighter uppercase ${commandeSelectionnee === cmd.id ? 'text-white' : 'text-[#1E3A8A]'}`}>
                                    {cmd.clientNom || <span className="text-rose-500">⚠ Nom manquant</span>}
                                  </h3>
                                </div>
                                {/* Téléphone */}
                                <div className={`flex items-center gap-2 ${commandeSelectionnee === cmd.id ? 'text-white/80' : 'text-slate-600'}`}>
                                  <Phone size={14} className={commandeSelectionnee === cmd.id ? 'text-white/60' : 'text-orange-400'} />
                                  <span className="text-sm font-bold">{cmd.clientContact || '—'}</span>
                                </div>
                                {/* Montant restant */}
                                <div className={`p-4 rounded-2xl ${commandeSelectionnee === cmd.id ? 'bg-white/20' : 'bg-orange-100'}`}>
                                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${commandeSelectionnee === cmd.id ? 'text-white/60' : 'text-orange-500'}`}>Reste à payer</p>
                                  <p className={`text-3xl font-black tracking-tighter ${commandeSelectionnee === cmd.id ? 'text-white' : 'text-rose-600'}`}>
                                    {((cmd.montantRestant ?? (cmd.total - (cmd.montantPaye || 0))) || 0).toLocaleString()} <span className="text-xs font-bold opacity-50">XAF</span>
                                  </p>
                                  {(cmd.montantPaye || 0) > 0 && (
                                    <p className={`text-[10px] font-bold mt-1 ${commandeSelectionnee === cmd.id ? 'text-white/50' : 'text-slate-400'}`}>
                                      Acompte versé : {(cmd.montantPaye || 0).toLocaleString()} F
                                    </p>
                                  )}
                                </div>
                                {/* Date promesse */}
                                {cmd.datePromessePaiement && (
                                  <div className={`flex items-center gap-2 text-[11px] font-bold ${commandeSelectionnee === cmd.id ? 'text-white/70' : 'text-emerald-700'}`}>
                                    <Clock size={13} className={commandeSelectionnee === cmd.id ? 'text-white/50' : 'text-emerald-500'} />
                                    Promis le : {new Date(cmd.datePromessePaiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </div>
                                )}
                                {!cmd.datePromessePaiement && (
                                  <div className="flex items-center gap-2 text-[11px] font-bold text-rose-400">
                                    <AlertCircle size={13} /> Aucune date fixée
                                  </div>
                                )}
                                {/* Date mise en arriéré */}
                                {cmd.dateMiseEnArriere && (
                                  <p className={`text-[9px] font-bold uppercase tracking-widest ${commandeSelectionnee === cmd.id ? 'text-white/40' : 'text-slate-400'}`}>
                                    Enregistré le {new Date(cmd.dateMiseEnArriere).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              /* ── CARTE ACTIVE NORMALE ── */
                              <>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            commandeSelectionnee === cmd.id ? 'bg-white/10 text-white' : 
                                            isDemandeAddition ? 'bg-rose-500 text-white' : 'bg-slate-50 text-[#1E3A8A]'
                                        }`}>
                                            {cmd.tableNom || 'DIRECTE'} {isDemandeAddition ? ' (ADDITION DEMANDÉE)' : ''}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDemandeAddition && commandeSelectionnee !== cmd.id ? 'text-rose-400' : 'opacity-40'}`}># {cmd.id.slice(-4).toUpperCase()}</span>
                                    </div>
                                    <h3 className={`text-2xl font-black tracking-tighter uppercase leading-tight ${commandeSelectionnee === cmd.id ? 'text-white' : isDemandeAddition ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>
                                        {cmd.clientNom || 'Client direct'}
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">Serveur: {cmd.serveurNom}</p>
                                </div>

                                <div className="flex justify-between items-end mt-8">
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${commandeSelectionnee === cmd.id ? 'text-white/40' : 'text-slate-300'}`}>Total à encaisser</p>
                                        <p className={`text-3xl font-black tracking-tighter ${commandeSelectionnee === cmd.id ? 'text-white' : 'text-[#FF7A00]'}`}>
                                            {(cmd.total || 0).toLocaleString()} <span className="text-xs font-bold opacity-30">XAF</span>
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${commandeSelectionnee === cmd.id ? 'bg-[#FF7A00] text-white' : 'bg-slate-50 text-slate-200'}`}>
                                        <ArrowRight size={24} />
                                    </div>
                                </div>
                              </>
                            )}
                        </button>
                        );
                    })}
                    
                    {commandesActives.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                            <Receipt size={80} className="text-[#1E3A8A]" />
                            <p className="text-sm font-black text-[#1E3A8A] uppercase tracking-[0.5em]">Aucune commande en attente</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Side: Payment Processing Area */}
        {commandeSelectionnee ? (
            <div className="w-[500px] bg-white border-l border-slate-100 flex flex-col shadow-2xl relative z-20">
                <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                    {/* Items List Summary */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 bg-[#1E3A8A] rounded-full" />
                                <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Détails de vente</h3>
                            </div>
                            <button onClick={() => setCommandeSelectionnee(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {commandeActive?.lignes.map((ligne, idx) => (
                                <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-black text-[#1E3A8A]">{ligne.quantite}</span>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-tight leading-none">{ligne.produitNom}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{(ligne.prixUnitaire || 0).toLocaleString()} / unité</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-[#1E3A8A]">{(ligne.sousTotal || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Payment Method Selection */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-[#FF7A00] rounded-full" />
                            <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Encaissement</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'especes', label: 'Espèces', icon: <Banknote size={24} /> },
                                { id: 'mobile', label: 'M-Money', icon: <Smartphone size={24} /> },
                                { id: 'carte', label: 'CB / Carte', icon: <CardIcon size={24} /> },
                                { id: 'credit', label: 'Crédit Client', icon: <HistoryIcon size={24} /> },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                      setModePaiement(m.id as any);
                                      if (m.id !== 'credit') setMontantSaisi(totalNet.toString());
                                      else setMontantSaisi('0');
                                    }}
                                    className={`h-28 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden border-2 ${
                                      modePaiement === m.id 
                                        ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl shadow-blue-900/20' 
                                        : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-blue-100 hover:bg-white'
                                    }`}
                                >
                                    {m.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Dynamic Payment Fields */}
                    {modePaiement && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                             {modePaiement !== 'credit' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner text-center focus-within:bg-white focus-within:border-blue-100 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Montant reçu (XAF)</p>
                                        <input 
                                            type="number" 
                                            value={montantSaisi} 
                                            onChange={e => setMontantSaisi(e.target.value)}
                                            className="w-full text-center text-6xl font-black text-[#1E3A8A] bg-transparent outline-none tracking-tighter"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {monnaieRendue > 0 && (
                                            <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center animate-in zoom-in duration-300">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">À Rendre</p>
                                                <p className="text-3xl font-black text-emerald-700 tracking-tighter">{monnaieRendue.toLocaleString()}</p>
                                            </div>
                                        )}
                                        {resteAPayer > 0 && (
                                            <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 text-center animate-in zoom-in duration-300">
                                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Reste</p>
                                                <p className="text-3xl font-black text-rose-700 tracking-tighter">{resteAPayer.toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}

                             {modePaiement === 'mobile' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Référence Transaction</label>
                                    <div className="relative">
                                        <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            value={refPaiement} onChange={e => setRefPaiement(e.target.value)}
                                            placeholder="Code de confirmation..."
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:border-[#1E3A8A] transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                             )}

                              {(modePaiement === 'credit' || resteAPayer > 0 || (commandeActive?.statut === 'en_arriere')) && (
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                       <div className="flex items-center gap-3">
                                          <UserPlus size={20} className="text-[#FF7A00]" />
                                          <h4 className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-widest">Compte Client</h4>
                                       </div>
                                       {commandeActive?.clientContact && (
                                          <button 
                                            onClick={() => relancerWhatsApp(commandeActive)}
                                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20"
                                            title="Relancer par WhatsApp"
                                          >
                                            <Phone size={16} />
                                          </button>
                                       )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input 
                                                value={nomClient} onChange={e => setNomClient(e.target.value)}
                                                placeholder="Nom complet..."
                                                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-[#1E3A8A] transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input 
                                                value={contactClient} onChange={e => setContactClient(e.target.value)}
                                                placeholder="Contact..."
                                                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 focus:border-[#1E3A8A] transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                              )}
                        </div>
                    )}
                </div>

                <div className="p-10 bg-white border-t border-slate-50 space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <div className="text-left">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Déjà versé</span>
                            <span className="text-xl font-black text-emerald-500">{dejaPaye.toLocaleString()} F</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block">Reste à payer</span>
                            <span className="text-5xl font-black tracking-tighter text-[#1E3A8A]">{resteAPayer.toLocaleString()} <span className="text-xl font-bold opacity-30">XAF</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleAcompte}
                            disabled={!modePaiement || montantRecu <= 0}
                            className="h-20 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-emerald-100 hover:bg-emerald-100 disabled:opacity-30 transition-all flex flex-col items-center justify-center leading-tight"
                        >
                            <span>Enregistrer</span>
                            <span className="text-[9px] opacity-60">Acompte</span>
                        </button>
                        <button
                            onClick={() => {
                              if (!nomClient || !contactClient) {
                                toast.error('Identité et contact du client requis pour un arriéré');
                                return;
                              }
                              if(window.confirm(`Libérer la table ? La dette de ${((commandeActive?.total || 0) - (commandeActive?.montantPaye || 0)).toLocaleString()} F sera enregistrée au nom de ${nomClient}.`)) {
                                mettreEnArriere(commandeSelectionnee!, datePromesse, nomClient, contactClient);
                                setCommandeSelectionnee(null);
                                setDatePromesse('');
                              }
                            }}
                            disabled={!commandeActive || commandeActive.statut === 'en_arriere'}
                            className="h-20 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-orange-100 hover:bg-orange-100 disabled:opacity-30 transition-all flex flex-col items-center justify-center leading-tight"
                        >
                            <span>Libérer Table</span>
                            <span className="text-[9px] opacity-60">(Mettre en Arriéré)</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={finaliserPaiement}
                            disabled={!modePaiement}
                            className="h-20 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 disabled:opacity-30 flex items-center justify-center gap-3 group hover:bg-blue-800"
                        >
                            Clôturer Vente <Check size={20} className="text-[#FF7A00]" />
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="w-[500px] bg-white border-l border-slate-100 flex flex-col items-center justify-center text-center p-20 space-y-8">
                <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-[#1E3A8A] shadow-inner opacity-40">
                    <Database size={64} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tighter">Prêt pour encaissement</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed max-w-[280px]">Sélectionnez une commande active à gauche pour commencer le protocole de paiement.</p>
                </div>
            </div>
        )}
      </main>

      {/* Modals are already present in original and just need slight aesthetic touches */}
      {!sessionActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-3xl" />
          <div className="w-full max-w-xl bg-white p-16 md:p-24 rounded-[4rem] relative shadow-2xl animate-in zoom-in-95 duration-500 text-center border border-white/20">
            <div className="w-32 h-32 bg-blue-50 rounded-[3rem] flex items-center justify-center mx-auto mb-12 text-[#1E3A8A] shadow-inner">
              <Unlock size={64} />
            </div>
            <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-4 leading-none">Initialisation</h2>
            <p className="text-slate-500 font-medium text-lg mb-16">Ouvrez votre session pour activer les protocoles d'encaissement.</p>
            
            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 mb-16 shadow-inner focus-within:bg-white focus-within:border-blue-100 transition-all">
               <div className="flex items-center justify-between mb-6">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fond de caisse (XAF)</p>
                 {isAdmin ? (
                   <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-3 py-1 rounded-full">Gérant : Modification Autorisée</span>
                 ) : (
                   <span className="text-[10px] font-bold text-rose-500 bg-rose-100 px-3 py-1 rounded-full">Verrouillé</span>
                 )}
               </div>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => {
                  if (isAdmin) setFondsSaisi(e.target.value);
                }}
                readOnly={!isAdmin}
                className={`w-full text-center text-7xl font-black outline-none bg-transparent text-[#1E3A8A] tracking-tighter ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                autoFocus={isAdmin}
               />
               {!isAdmin && <p className="text-xs text-rose-500 font-bold mt-4 uppercase">Ce montant est reporté de la clôture de la veille. Seul le gérant peut le modifier.</p>}
            </div>

            <button 
              onClick={async () => {
                try {
                  await ouvrirSession(Number(fondsSaisi), idEmploye || '', nomEmploye || '');
                } catch (error: any) {
                  toast.error(error?.message || "Impossible d'ouvrir la caisse");
                }
              }}
              className="w-full h-24 bg-[#1E3A8A] text-white rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-2xl shadow-blue-900/30 text-lg flex items-center justify-center gap-6"
            >
              Démarrer le Service <ArrowRight size={32} />
            </button>
          </div>
        </div>
      )}

      {showClotureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => setShowClotureModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl" />
          <div className="w-full max-w-xl bg-white p-16 md:p-24 rounded-[4rem] relative shadow-2xl animate-in zoom-in-95 duration-300 text-center border border-slate-100">
            <div className="w-32 h-32 bg-rose-50 rounded-[3rem] flex items-center justify-center mx-auto mb-12 text-rose-500 shadow-inner">
              <Lock size={64} />
            </div>
            <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-4 leading-none">Clôture Finale</h2>
            <p className="text-slate-500 font-medium text-lg mb-8">Validez le solde de fin de journee pour liberer la caisse. La signature du caissier sera enregistree.</p>
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solde theorique cash</p>
                <p className="text-xl font-black text-[#1E3A8A]">{soldeTheoriqueCloture.toLocaleString()} XAF</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Ecart attendu</p>
                <p className="text-xl font-black text-[#FF7A00]">{(Number(fondsSaisi || 0) - soldeTheoriqueCloture).toLocaleString()} XAF</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 mb-16 shadow-inner focus-within:bg-white focus-within:border-rose-100 transition-all">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Montant Constaté (XAF)</p>
               <input 
                type="number"
                value={fondsSaisi}
                onChange={e => setFondsSaisi(e.target.value)}
                className="w-full text-center text-7xl font-black outline-none bg-transparent text-rose-500 tracking-tighter"
                autoFocus
               />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button 
                onClick={() => setShowClotureModal(false)}
                className="h-20 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={async () => {
                  await fermerSession(Number(fondsSaisi));
                  setShowClotureModal(false);
                }}
                className="h-20 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-900/20 hover:bg-rose-600 transition-all"
              >
                Clôturer
              </button>
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

export default InterfaceCaissier;
