import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Users, ChevronRight, Plus, Minus, Send, 
  X, ShoppingBag, Smartphone, Clock, LogOut,
  LayoutGrid, Utensils, Coffee, Zap, Info,
  CheckCircle2, AlertTriangle, ArrowLeft, Star,
  ShieldCheck, Crown, User, Search, Receipt,
  ClipboardList, CreditCard, ChevronDown, History, Trash2,
  MoreVertical, Power, RefreshCcw, MoreHorizontal, ArrowRight, Check, Bell, Lock, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePOSStore, imprimerBonPreparation, imprimerTicket } from '../../store/posStore';
import { usePosteSession } from '../../hooks/usePosteSession';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Produit, TablePlan, Commande, LigneCommande } from '../../store/posStore';

const InterfaceServeur = () => {
  const { 
    tables, produits, commandes, 
    ouvrirTable, ajouterLigne, modifierQuantite, 
    supprimerLigne, envoyerCuisine, annulerCommande, demanderAddition,
    marquerCommandeServie, forcerLiberationTable, initPOS, etablissement_id: posEtabId, isOnline
  } = usePOSStore();
  const { profil } = useAuthStore();
  
  const { nomEmploye, etablissementId, quitterPoste, idEmploye } = usePosteSession();
  const navigate = useNavigate();

  // Auto-initialiser le store si accès direct (hors tableau de bord)
  useEffect(() => {
    const etabId = etablissementId || profil?.etablissement_id;
    if (etabId && !posEtabId) initPOS(etabId);
  }, [etablissementId, profil?.etablissement_id, posEtabId, initPOS]);
  
  const [etape, setEtape] = useState<'tables' | 'couverts' | 'commande'>('tables');

  // Audio pour le bip
  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play blocked by browser", e));
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };
  const [tableSelectionnee, setTableSelectionnee] = useState<TablePlan | null>(null);
  const [nombreCouverts, setNombreCouverts] = useState(1);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [categorieActive, setCategorieActive] = useState<string>('Tout');
  const [rechercheProduit, setRechercheProduit] = useState('');
  const [showTableActions, setShowTableActions] = useState<string | null>(null);

  // Écouteur de notifications "Prêt"
  useEffect(() => {
    if (!etablissementId || !idEmploye) return;

    const q = query(
      collection(db, 'notifications_postes'),
      where('etablissement_id', '==', etablissementId),
      where('serveurId', '==', idEmploye),
      where('statut', '==', 'non_lu')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = change.doc.data();
          
          // Jouer le son et vibrer
          playNotificationSound();
          
          // Afficher le toast
          toast.success(notif.message, {
            duration: 6000,
            icon: '🍽️',
            style: {
              background: '#FF7A00',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '1rem',
              border: '2px solid white'
            }
          });

          // Marquer comme lu immédiatement
          updateDoc(doc(db, 'notifications_postes', change.doc.id), { statut: 'lu' });
        }
      });
    }, (err) => {
      console.warn("notifications_postes error:", err.message);
    });

    return () => unsubscribe();
  }, [etablissementId, idEmploye]);

  const commandeActive = useMemo(() => 
    commandes.find(c => c.id === commandeId),
    [commandes, commandeId]
  );

  const categories = useMemo(() => 
    ['Tout', ...new Set(produits.map(p => p.categorie))],
    [produits]
  );

  const produitsFiltres = useMemo(() => 
    produits.filter(p => {
      const matchCat = categorieActive === 'Tout' || p.categorie === categorieActive;
      const matchSearch = p.nom.toLowerCase().includes(rechercheProduit.toLowerCase());
      return matchCat && matchSearch;
    }),
    [produits, categorieActive, rechercheProduit]
  );

  const tournees = useMemo(() => {
    if (!commandeActive) return [];
    const groups: { [key: string]: LigneCommande[] } = {};
    (commandeActive.lignes || []).forEach(ligne => {
      if (ligne.heureEnvoi) {
        if (!groups[ligne.heureEnvoi]) groups[ligne.heureEnvoi] = [];
        groups[ligne.heureEnvoi].push(ligne);
      }
    });
    return Object.entries(groups).map(([time, items]) => ({
      time,
      items,
      total: items.reduce((sum, item) => sum + item.sousTotal, 0)
    })).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [commandeActive]);

  const panierActuel = useMemo(() => 
    commandeActive?.lignes.filter(l => !l.heureEnvoi) || [],
    [commandeActive]
  );

  const handleFermerTable = async (cId: string) => {
    if (window.confirm("Voulez-vous vraiment annuler la commande ?")) {
      try {
        const toastId = toast.loading("Annulation en cours...");
        await annulerCommande(cId);
        toast.success("Table libérée", { id: toastId });
        setCommandeId(null);
        setTableSelectionnee(null);
        setEtape('tables');
        setShowTableActions(null);
      } catch (err) {
        toast.error("Erreur lors de l'opération");
      }
    }
  };

  const zones = ['salle', 'terrasse', 'vip', 'comptoir'] as const;

  if (etape === 'tables') {
    return (
      <div className="h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] overflow-hidden">
        <header className="h-28 bg-[#1E3A8A] px-10 flex items-center justify-between shadow-xl relative z-20 shrink-0">
            <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#FF7A00] shadow-lg border border-white/10">
                    <User size={32} />
                </div>
                <div>
                    <h1 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">
                        Bienvenue, <span className="text-[#FF7A00]">{nomEmploye?.split(' ')[0]}</span> !
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-blue-200 font-black text-[10px] uppercase tracking-[0.2em]">Session Active • {nomEmploye}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">ID Agent</p>
                    <p className="text-white font-bold text-xs">#{idEmploye?.slice(-5).toUpperCase()}</p>
                </div>
                <button onClick={quitterPoste} className="flex items-center gap-3 px-6 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/20">
                    <LogOut size={18} />
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 no-scrollbar">
            {zones.map(zone => (
                <section key={zone} className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{zone}</h2>
                        <div className="h-[1px] flex-1 bg-slate-100" />
                        {zone === 'comptoir' && (
                            <button 
                              onClick={() => {
                                  const tableComptoir = tables.find(t => t.zone === 'comptoir');
                                  if (tableComptoir) {
                                      setTableSelectionnee({...tableComptoir, nom: `Client ${commandes.filter(c => (c.tableNom || '').startsWith('Comptoir')).length + 1}`});
                                      setEtape('couverts');
                                  }
                              }}
                              className="px-4 py-2 bg-[#FF7A00] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 flex items-center gap-2 hover:bg-orange-600 transition-all"
                            >
                                <Plus size={14} /> Nouveau Client au Comptoir
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
                        { (zone === 'comptoir' ? commandes.filter(c => (c.tableNom || '').startsWith('Comptoir') && c.statut !== 'payee') : tables.filter(t => t.zone === zone) ).map(item => {
                           const isTable = 'zone' in item;
                           const table = isTable ? (item as TablePlan) : null;
                           const commande = isTable ? (commandes.find(c => c.tableId === table?.id && c.statut !== 'payee')) : (item as Commande);
                           
                           const nomAffiche = isTable ? table?.nom : `Comptoir ${commande?.clientNom || '#' + commande?.id.slice(-3)}`;
                           const isOccupee = isTable ? table?.statut === 'occupee' : true;
                           const isAddition = isTable ? table?.statut === 'en_attente_paiement' : (commande?.statut === 'en_attente_paiement');
                           const aDesProduitsPrets = commande?.lignes.some(l => l.statut === 'pret');
                           
                           return (
                             <button 
                               key={isTable ? table?.id : commande?.id}
                               onClick={async () => {
                                 if (commande) {
                                   setCommandeId(commande.id);
                                   setEtape('commande');
                                   setNombreCouverts(commande.nombreCouverts || 1);
                                   setTableSelectionnee(isTable ? table : { id: 'comptoir-virtual', nom: nomAffiche, zone: 'comptoir', capacite: 1, statut: 'occupee' } as any);
                                 } else if (isTable && !isOccupee && !isAddition) {
                                   setTableSelectionnee(table);
                                   setEtape('couverts');
                                 } else if (isTable && (isOccupee || isAddition)) {
                                   if (window.confirm(`La table ${table?.nom} semble bloquée sans commande active. Voulez-vous la libérer de force ?`)) {
                                     await forcerLiberationTable(table!.id);
                                     toast.success("Table libérée");
                                   }
                                 }
                               }}
                               className={`h-48 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden group shadow-sm ${
                                 isOccupee || !isTable ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-xl shadow-blue-900/20' : 
                                 isAddition ? 'bg-orange-50 border-orange-200 text-[#FF7A00]' : 
                                 'bg-white border-slate-100 text-slate-400 hover:border-blue-100 hover:bg-slate-50'
                               }`}
                             >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isOccupee || !isTable ? 'bg-white/10' : (isAddition ? 'bg-orange-100 text-orange-600' : 'bg-slate-50')}`}>
                                    {aDesProduitsPrets ? <Bell size={28} className="text-orange-400 animate-bounce" /> : (isAddition ? <Receipt size={28} /> : (table?.zone === 'vip' ? <Crown size={28} /> : <Utensils size={28} />))}
                                </div>
                                <div className="text-center">
                                    <h3 className={`text-2xl font-black tracking-tighter leading-none ${isOccupee || !isTable ? 'text-white' : 'text-[#1E3A8A]'}`}>{nomAffiche}</h3>
                                    {(isOccupee || isAddition || !isTable) && commande && (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-orange-400 font-black text-xs uppercase">
                                            {( (commande.montantRestant !== undefined) ? commande.montantRestant : (commande.total || 0) ).toLocaleString()} 
                                            <span className="text-[10px] opacity-60"> XAF</span>
                                          </p>
                                          <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest mx-auto w-fit ${isOccupee ? 'bg-white/10 text-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                                            {commande.serveurNom?.split(' ')[0]}
                                          </div>
                                        </div>
                                    )}
                                    {aDesProduitsPrets && (
                                        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                                            À RÉCUPÉRER
                                        </div>
                                    )}
                                    {isAddition && <p className="text-orange-600 font-black text-[10px] uppercase mt-2 animate-pulse">Addition demandée</p>}
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOccupee || !isTable ? 'bg-white/10 text-white/60' : 'bg-slate-50 text-slate-300'}`}>
                                    <Users size={12} /> {table?.capacite || 1} places
                                </div>
                             </button>
                           );
                        })}
                    </div>
                </section>
            ))}
        </main>
      </div>
    );
  }

  if (etape === 'couverts') {
      return (
          <div className="h-screen bg-[#1E3A8A] flex items-center justify-center p-6 md:p-12 font-['Inter',sans-serif]">
              <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-3xl" />
              <div className="max-w-xl w-full bg-white p-12 md:p-16 rounded-[4rem] relative shadow-2xl animate-in zoom-in-95 duration-500 border border-white/20 text-center">
                  <div className="w-24 h-24 bg-blue-50 text-[#1E3A8A] rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <Users size={48} />
                  </div>
                  <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-2">Nombre de Couverts</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12">Table sélectionnée : <span className="text-[#FF7A00]">{tableSelectionnee?.nom}</span></p>
                  
                  <div className="flex items-center justify-center gap-10 mb-16">
                      <button onClick={() => setNombreCouverts(Math.max(1, nombreCouverts - 1))} className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-[#1E3A8A] hover:bg-blue-50 transition-all active:scale-90 border border-slate-100">
                          <Minus size={32} />
                      </button>
                      <span className="text-8xl font-black text-[#1E3A8A] tracking-tighter w-32">{nombreCouverts}</span>
                      <button onClick={() => setNombreCouverts(nombreCouverts + 1)} className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-[#1E3A8A] hover:bg-blue-50 transition-all active:scale-90 border border-slate-100">
                          <Plus size={32} />
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setEtape('tables')} className="h-20 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest text-xs">Annuler</button>
                      <button onClick={async () => {
                          const id = await ouvrirTable(tableSelectionnee!.id, idEmploye || 'inconnu', nomEmploye || 'Serveur', nombreCouverts);
                          setCommandeId(id);
                          setEtape('commande');
                      }} className="h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20">Lancer la commande</button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] text-slate-800 overflow-hidden">
        {/* Terminal Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between relative z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setEtape('tables')} className="p-3 bg-slate-50 text-[#1E3A8A] rounded-2xl hover:bg-blue-50 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                <div>
                    <h2 className="text-xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none">{tableSelectionnee?.nom}</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{nombreCouverts} Couverts • # {commandeId?.slice(-4).toUpperCase()}</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="bg-orange-50 px-5 py-2 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">Total Net</p>
                    <p className="text-xl font-black text-[#1E3A8A] tracking-tighter">{(commandeActive?.total || 0).toLocaleString()} <span className="text-[10px] opacity-40">XAF</span></p>
                </div>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            {/* Products Selection Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Categories Scroll */}
                <div className="h-24 px-8 flex items-center gap-4 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategorieActive(cat)}
                          className={`px-8 py-3.5 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${
                            categorieActive === cat 
                            ? 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {produitsFiltres.map(p => (
                            <button key={p.id} onClick={() => {
                                if (commandeActive && commandeActive.serveurId !== idEmploye) {
                                    toast.error(`Cette table est gérée par ${commandeActive.serveurNom}`);
                                    return;
                                }
                                ajouterLigne(commandeId!, p);
                            }}
                              className="aspect-[4/5] bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between text-left group hover:border-[#FF7A00] transition-all hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-blue-50 transition-colors">
                                    {(p.categorie || '').toLowerCase().includes('biere') ? '🍺' : 
                                     (p.categorie || '').toLowerCase().includes('vin') ? '🍷' : 
                                     (p.categorie || '').toLowerCase().includes('jus') ? '🥤' : 
                                     (p.categorie || '').toLowerCase().includes('soda') ? '🥤' : 
                                     (p.categorie || '').toLowerCase().includes('eau') ? '💧' : 
                                     (p.categorie || '').toLowerCase().includes('champagne') ? '🍾' : 
                                     (p.categorie || '').toLowerCase().includes('cocktail') ? '🍸' : '🍴'}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-tight leading-tight line-clamp-2">{p.nom}</h4>
                                    <p className="text-lg font-black text-[#FF7A00] tracking-tighter mt-2">{(p.prix || 0).toLocaleString()} <span className="text-[10px] opacity-40">XAF</span></p>
                                </div>
                                <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {(p.categorie?.toLowerCase().includes('liqueur') || p.categorie?.toLowerCase().includes('spirit')) ? (
                                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => ajouterLigne(commandeId!, p, 0.25)} className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black hover:bg-blue-600 transition-all">1/4</button>
                                            <button onClick={() => ajouterLigne(commandeId!, p, 0.5)} className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black hover:bg-blue-700 transition-all">1/2</button>
                                            <button onClick={() => ajouterLigne(commandeId!, p, 1)} className="w-8 h-8 bg-[#FF7A00] text-white rounded-lg flex items-center justify-center text-[10px] font-black hover:bg-orange-600 transition-all">1</button>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-[#FF7A00] text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                                            <Plus size={20} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar Area */}
            <div className="w-[480px] bg-white border-l border-slate-100 flex flex-col shadow-2xl relative z-20">
                <div className="h-16 px-10 flex items-center justify-between border-b border-slate-50 shrink-0">
                    <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest">Panier Actuel</h3>
                    <div className="px-3 py-1 bg-blue-50 text-[#1E3A8A] rounded-full text-[10px] font-black uppercase tracking-widest">{panierActuel.length} articles</div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                    {/* Items ready for submission */}
                    {panierActuel.map((ligne, idx) => (
                        <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-6 animate-in slide-in-from-right duration-300">
                             <div className="flex items-center gap-4">
                                <button onClick={() => modifierQuantite(commandeId!, ligne.id, -1)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm transition-all"><Minus size={16} /></button>
                                <span className="text-2xl font-black text-[#1E3A8A] w-6 text-center">{ligne.quantite}</span>
                                <button onClick={() => modifierQuantite(commandeId!, ligne.id, 1)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:text-[#1E3A8A] border border-slate-100 shadow-sm transition-all"><Plus size={16} /></button>
                             </div>
                             <div className="flex-1">
                                <h4 className="text-sm font-black text-[#1E3A8A] uppercase tracking-tight leading-none">{ligne.produitNom}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{(ligne.prixUnitaire || 0).toLocaleString()} XAF</p>
                                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${ligne.destination === 'bar' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {ligne.destination === 'bar' ? 'BAR' : 'CUISINE'}
                                    </div>
                                </div>
                             </div>
                             <button onClick={() => supprimerLigne(commandeId!, ligne.id)} className="w-10 h-10 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                        </div>
                    ))}
                    
                    {panierActuel.length === 0 && tournees.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 py-20">
                            <ShoppingBag size={80} className="text-[#1E3A8A]" />
                            <p className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Le panier est vide</p>
                        </div>
                    )}

                    {/* History of submissions (tournees) */}
                    {tournees.length > 0 && (
                        <div className="pt-8 space-y-8">
                            <div className="flex items-center gap-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Historique des envois</h4>
                                <div className="h-[1px] flex-1 bg-slate-100" />
                            </div>
                            {tournees.map((tournee, tIdx) => (
                                <div key={tIdx} className="space-y-3 opacity-60">
                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> {new Date(tournee.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        <span className="text-[10px] font-black text-slate-400">{(tournee.total || 0).toLocaleString()} XAF</span>
                                    </div>
                                    {tournee.items.map((item, iIdx) => (
                                        <div key={iIdx} className="px-6 py-4 bg-white border border-slate-50 rounded-2xl flex justify-between items-center">
                                            <span className="text-xs font-bold text-[#1E3A8A]">{item.quantite}x {item.produitNom}</span>
                                            <div className="flex items-center gap-2">
                                                {item.statut === 'pret' ? <div className="w-2 h-2 bg-emerald-500 rounded-full" /> : <div className="w-2 h-2 bg-orange-400 animate-pulse rounded-full" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 md:p-10 bg-white border-t border-slate-50 space-y-6">
                    {commandeActive?.lignes.some(l => l.statut === 'pret') && (
                      commandeActive.serveurId === idEmploye ? (
                        <button 
                          onClick={async () => {
                              const toastId = toast.loading("Mise à jour du service...");
                              await marquerCommandeServie(commandeId!);
                              toast.success("Plats marqués comme servis !", { id: toastId });
                          }}
                          className="w-full h-20 bg-orange-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-900/20 flex items-center justify-center gap-4 hover:bg-orange-600 transition-all animate-pulse"
                        >
                            <Utensils size={24} /> CONFIRMER LE SERVICE (À RÉCUPÉRER)
                        </button>
                      ) : (
                        <div className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-200 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                <ShieldCheck size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                Seul <span className="text-[#1E3A8A]">{commandeActive.serveurNom}</span> peut valider ce service.
                            </p>
                        </div>
                      )
                    )}

                    <div className="flex gap-4">
                        <button 
                          onClick={() => {
                              if (commandeActive && commandeActive.serveurId !== idEmploye) {
                                  toast.error("Action réservée au serveur responsable");
                                  return;
                              }
                              handleFermerTable(commandeId!);
                          }} 
                          className={`flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] border transition-all shadow-sm flex items-center justify-center gap-2 ${
                            commandeActive?.serveurId === idEmploye 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-500 hover:text-white' 
                              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 size={16} /> ANNULER / LIBÉRER LA TABLE
                        </button>
                        <button onClick={() => {
                            demanderAddition(commandeId!, tableSelectionnee?.id || '');
                            imprimerTicket(commandeActive!, profil?.etablissement_nom || 'GESTCAVE PRO');
                        }} className="flex-1 h-16 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-emerald-100 hover:bg-emerald-100 transition-all">L'addition</button>
                    </div>
                    {commandeActive?.serveurId === idEmploye ? (
                        panierActuel.length > 0 ? (
                        <button 
                          onClick={async () => {
                              const toastId = toast.loading("Envoi en cuisine...");
                              toast.success("Commande envoyée !", { id: toastId });
                              await envoyerCuisine(commandeId!);
                          }}
                          className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 flex items-center justify-center gap-4 hover:bg-blue-800 transition-all group"
                        >
                            Envoyer en production <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        ) : (
                        <div className="w-full h-20 bg-emerald-50 border-2 border-emerald-200 text-emerald-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4">
                            <CheckCircle2 size={20} /> Déjà envoyé en production
                        </div>
                        )
                    ) : (
                        <div className="w-full h-20 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 cursor-not-allowed border border-slate-200">
                           <Lock size={20} /> COMMANDE VERROUILLÉE
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default InterfaceServeur;
