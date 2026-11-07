import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Minus, Search, 
  AlertCircle, Trash2, Edit3, Save, 
  Archive, Layers, BarChart3, TrendingDown,
  ChevronRight, MoreVertical, X, ArrowUpRight,
  Database, Zap, ArrowRight, CheckCircle2, History, Filter
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Produit {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  stockTotal: number;
  unitesParCasier: number;
  stockAlerte: number;
  emoji?: string;
  uniteMesure?: string;
  destination_production?: 'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha';
  recette?: {
    ingredientId: string;
    nom: string;
    quantite: number;
  }[];
}

const GestionStocks = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState<string>('Tous');
  const [showModal, setShowModal] = useState(false);
  const [showComptage, setShowComptage] = useState(false);
  const [showRecetteModal, setShowRecetteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [stockReel, setStockReel] = useState<number>(0);
  const [ingredientSelectionne, setIngredientSelectionne] = useState('');
  const [quantiteIngredient, setQuantiteIngredient] = useState(1);

  // Formulaire Nouvel Article
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState(0);
  const [categorie, setCategorie] = useState<'Boisson' | 'Ingrédient' | 'A-Côté'>('Boisson');
  const [unitesParCasier, setUnitesParCasier] = useState(12);
  const [stockAlerte, setStockAlerte] = useState(10);
  const [emoji, setEmoji] = useState('🥤');
  const [uniteMesure, setUniteMesure] = useState('Unités');
  const [destination, setDestination] = useState<'cuisine' | 'bar' | 'pizzeria' | 'grill' | 'chicha'>('cuisine');

  useEffect(() => {
    if (!etablissementId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId));
    const unsub = onSnapshot(
      q, 
      (snap) => {
        setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[]);
        setLoading(false);
      },
      (err) => {
        console.warn("produits listener error:", err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [profil?.etablissement_id]);

  const ajouterProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'produits'), {
        nom,
        prix,
        categorie,
        unitesParCasier,
        stockAlerte,
        emoji,
        uniteMesure: categorie === 'Boisson' ? 'bouteilles' : uniteMesure,
        destination,
        stockTotal: 0,
        historique: [],
        etablissement_id: etablissementId,
        date_creation: new Date().toISOString()
      });
      toast.success(`${nom} ajouté avec succès`);
      setShowModal(false);
      reinitialiserForm();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const reinitialiserForm = () => {
      setNom(''); setPrix(0); setEmoji('🥤'); setStockAlerte(10);
      setSelectedProduct(null);
  };

  const ouvrirEdition = (p: Produit) => {
    setSelectedProduct(p);
    setNom(p.nom);
    setPrix(p.prix);
    setCategorie(p.categorie as any);
    setUnitesParCasier(p.unitesParCasier || 1);
    setStockAlerte(p.stockAlerte || 0);
    setEmoji(p.emoji || '📦');
    setUniteMesure(p.uniteMesure || 'u');
    setDestination(p.destination_production || 'bar');
    setShowModal(true);
  };

  const modifierProduit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await updateDoc(doc(db, 'produits', selectedProduct.id), {
        nom,
        prix,
        categorie,
        unitesParCasier,
        stockAlerte,
        emoji,
        uniteMesure: categorie === 'Boisson' ? 'bouteilles' : uniteMesure,
        destination_production: destination
      });
      toast.success(`${nom} mis à jour`);
      setShowModal(false);
      reinitialiserForm();
    } catch {
      toast.error("Erreur lors de la modification");
    }
  };

  const supprimerProduit = async (p: Produit) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement ${p.nom.toUpperCase()} ?`)) return;
    try {
      await deleteDoc(doc(db, 'produits', p.id));
      toast.success("Article supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const ajusterStock = async (p: Produit, delta: number, type: 'unite' | 'casier') => {
    const qte = type === 'casier' ? delta * (p.unitesParCasier || 1) : delta;
    const nouveau = Math.max(0, p.stockTotal + qte);
    try {
      await updateDoc(doc(db, 'produits', p.id), { stockTotal: nouveau });
      toast.success(delta > 0 ? "Approvisionnement réussi" : "Sortie enregistrée");
    } catch {
      toast.error("Erreur système");
    }
  };

  const validerComptage = async () => {
    if (!selectedProduct) return;
    const ecart = stockReel - selectedProduct.stockTotal;
    
    try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'produits', selectedProduct.id), { stockTotal: stockReel });
        
        const logRef = doc(collection(db, 'historique_stocks'));
        batch.set(logRef, {
            produitId: selectedProduct.id,
            produitNom: selectedProduct.nom,
            type: 'ajustement_inventaire',
            ancienStock: selectedProduct.stockTotal,
            nouveauStock: stockReel,
            ecart,
            date: new Date().toISOString(),
            etablissement_id: profil?.etablissement_id || ''
        });

        await batch.commit();
        toast.success(`Inventaire régularisé (${ecart >= 0 ? '+' : ''}${ecart} u)`);
        setShowComptage(false);
    } catch (e) {
        toast.error("Erreur lors de la mise à jour");
    }
  };

  const ajouterIngredientRecette = async () => {
    if (!selectedProduct || !ingredientSelectionne) return;
    
    const ingredient = produits.find(p => p.id === ingredientSelectionne);
    if (!ingredient) return;

    const nouvelleRecette = [
      ...(selectedProduct as any).recette || [],
      {
        ingredientId: ingredient.id,
        nom: ingredient.nom,
        quantite: quantiteIngredient
      }
    ];

    try {
      await updateDoc(doc(db, 'produits', selectedProduct.id), {
        recette: nouvelleRecette
      });
      toast.success(`Recette mise à jour`);
      setIngredientSelectionne('');
      setQuantiteIngredient(1);
    } catch (e) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const supprimerIngredientRecette = async (idx: number) => {
    if (!selectedProduct) return;
    const nouvelleRecette = [...((selectedProduct as any).recette || [])];
    nouvelleRecette.splice(idx, 1);

    try {
      await updateDoc(doc(db, 'produits', selectedProduct.id), {
        recette: nouvelleRecette
      });
      toast.success("Lien supprimé");
    } catch (e) {
      toast.error("Erreur système");
    }
  };

  const formatStock = (total: number, parCasier: number) => {
    if (parCasier <= 1) return <span className="text-slate-300">-</span>;
    const casiers = Math.floor(total / parCasier);
    const restants = total % parCasier;
    return (
      <div className="flex items-center gap-3">
        <span className="text-[#1E3A8A] font-extrabold text-sm">{casiers} <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">CASIERS</span></span>
        {restants > 0 && <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-100">+{restants} U</span>}
      </div>
    );
  };

  const categoriesList = ['Tous', ...new Set(produits.map(p => p.categorie))];
  const produitsFiltrés = produits.filter(p => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchCat = filtreCategorie === 'Tous' || p.categorie === filtreCategorie;
    return matchRecherche && matchCat;
  });

  const articlesEnAlerte = produits.filter(p => p.stockTotal <= p.stockAlerte).length;
  const valeurStockTotal = produits.reduce((acc, p) => acc + (p.stockTotal * p.prix), 0);

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Chargement de l'inventaire...</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Package size={14} />
              Gestion des Stocks
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Inventaire & <span className="text-[#FF7A00]">Articles</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Contrôlez vos ressources et optimisez votre approvisionnement.</p>
        </div>

        <div className="flex gap-3 relative z-10">
            <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
                <Plus size={20} /> Nouvel Article
            </button>
            <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all hover:bg-slate-50">
                <History size={20} /> Historique
            </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-6"><Layers size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Références</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight">{produits.length}</span>
              <span className="text-xs font-bold text-slate-400">Articles</span>
            </div>
          </div>
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6"><Database size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Valeur du Stock</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight">{valeurStockTotal.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">XAF</span>
            </div>
          </div>
          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6"><AlertCircle size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Alertes Critiques</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold tracking-tight ${articlesEnAlerte > 0 ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>{articlesEnAlerte}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ruptures</span>
            </div>
          </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white p-3 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5">
          <div className="relative flex-grow h-14 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Rechercher un article..." value={recherche} onChange={(e) => setRecherche(e.target.value)}
              className="w-full h-full pl-16 pr-8 bg-transparent border-none outline-none focus:ring-0 font-semibold text-slate-700 placeholder:text-slate-300" />
          </div>
          <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar w-full lg:w-auto">
              {categoriesList.map(cat => (
                <button key={cat} onClick={() => setFiltreCategorie(cat)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filtreCategorie === cat ? 'bg-white text-[#1E3A8A] shadow-sm shadow-blue-900/5 border border-slate-100' : 'text-slate-500 hover:text-[#1E3A8A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-6">Article</th>
                    <th className="px-8 py-6">Prix Unitaire</th>
                    <th className="px-8 py-6">Gestion / Colisage</th>
                    <th className="px-8 py-6">Stock Réel</th>
                    <th className="px-8 py-6 text-right">Actions rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {produitsFiltrés.map((p) => {
                    const estEnAlerte = p.stockTotal <= p.stockAlerte;
                    return (
                      <tr key={p.id} className={`group transition-all ${estEnAlerte ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white border border-slate-100 group-hover:scale-110 transition-transform shadow-sm">
                              {p.emoji || '📦'}
                            </div>
                            <div>
                              <div className="font-bold text-[#1E3A8A] text-base leading-tight mb-1">{p.nom}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.categorie}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                             <div className="flex items-baseline gap-1">
                               <span className="text-[#1E3A8A] font-extrabold text-lg">{p.prix.toLocaleString()}</span>
                               <span className="text-[10px] text-slate-300 font-bold uppercase">XAF</span>
                             </div>
                         </td>
                         <td className="px-8 py-6">
                           {p.categorie === 'Boisson' ? formatStock(p.stockTotal, p.unitesParCasier) : <span className="text-slate-400 italic text-[10px] uppercase font-bold tracking-widest">Détail {p.uniteMesure}</span>}
                         </td>
                         <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                 <span className={`text-xl font-black tracking-tight ${estEnAlerte ? 'text-rose-600' : 'text-[#1E3A8A]'}`}>{p.stockTotal}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.uniteMesure || 'u'}</span>
                                 {estEnAlerte && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                             </div>
                         </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                             <button 
                               onClick={() => {
                                   setSelectedProduct(p);
                                   setStockReel(p.stockTotal);
                                   setShowComptage(true);
                               }}
                               className="h-10 px-5 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all flex items-center gap-2"
                             >
                               <Archive size={14} /> Inventaire
                             </button>
                             {p.categorie !== 'Ingrédient' && (
                               <button 
                                 onClick={() => {
                                     setSelectedProduct(p);
                                     setShowRecetteModal(true);
                                 }}
                                 className="h-10 px-5 bg-blue-50 text-[#1E3A8A] text-xs font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
                               >
                                 <Zap size={14} /> Recette
                               </button>
                             )}
                             <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 ml-4">
                                <button onClick={() => ajusterStock(p, -1, 'unite')} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><Minus size={16} /></button>
                                <button onClick={() => ajusterStock(p, 1, 'unite')} className="w-8 h-8 flex items-center justify-center bg-white text-[#1E3A8A] rounded-lg shadow-sm border border-slate-100"><Plus size={16} /></button>
                             </div>
                              <div className="flex bg-[#1E3A8A] p-1 rounded-xl shadow-lg shadow-blue-900/10">
                                  <button onClick={() => ajusterStock(p, -1, 'casier')} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-all"><Layers size={16} /></button>
                                  <button onClick={() => ajusterStock(p, 1, 'casier')} className="w-8 h-8 flex items-center justify-center bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"><Plus size={16} /></button>
                               </div>
                             <button onClick={() => ouvrirEdition(p)} className="p-2 text-slate-300 hover:text-[#1E3A8A] transition-all ml-2">
                               <Edit3 size={18} />
                             </button>
                             <button onClick={() => supprimerProduit(p)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                               <Trash2 size={18} />
                             </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
          <div className="w-full max-w-xl bg-white p-10 md:p-12 rounded-[2.5rem] relative border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[#1E3A8A] text-[10px] font-bold uppercase tracking-widest mb-4">
                  {selectedProduct ? 'Modification Article' : 'Nouveau Référencement'}
                </div>
                <h3 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight">
                  {selectedProduct ? `Editer ${selectedProduct.nom}` : 'Nouvel Article'}
                </h3>
            </div>
            <form onSubmit={selectedProduct ? modifierProduit : ajouterProduit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Désignation de l'article</label>
                <input type="text" value={nom} onChange={(e)=>setNom(e.target.value)} placeholder="Ex: Heineken Prestige 33cl" required 
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-slate-700 shadow-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Catégorie</label>
                <select value={categorie} onChange={(e)=>setCategorie(e.target.value as any)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-700 focus:bg-white appearance-none shadow-sm">
                  <option value="Boisson">Boissons</option>
                  <option value="Ingrédient">Ingrédients / Cuisine</option>
                  <option value="A-Côté">Articles Divers</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Prix (XAF)</label>
                <input type="number" value={prix} onChange={(e)=>setPrix(Number(e.target.value))} required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-700 shadow-sm" />
              </div>
              {categorie === 'Boisson' ? (
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Conditionnement (Unités / Casier)</label>
                  <input type="number" value={unitesParCasier} onChange={(e)=>setUnitesParCasier(Number(e.target.value))} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-700 shadow-sm" />
                </div>
              ) : (
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Unité de mesure (Ex: Kg, Portions, Cartons)</label>
                  <select value={uniteMesure} onChange={(e)=>setUniteMesure(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-700 focus:bg-white appearance-none shadow-sm">
                    <option value="Unités">Unités (Pièces)</option>
                    <option value="Kg">Kilogrammes (Kg)</option>
                    <option value="Cartons">Cartons</option>
                    <option value="Portions">Portions</option>
                    <option value="Sacs">Sacs</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">Zone de Production</label>
                <select value={destination} onChange={(e)=>setDestination(e.target.value as any)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-slate-700 focus:bg-white appearance-none shadow-sm">
                  <option value="cuisine">Cuisine Centrale</option>
                  <option value="bar">Bar / Comptoir</option>
                  <option value="pizzeria">Zone Pizzeria</option>
                  <option value="grill">Espace Grillades</option>
                  <option value="chicha">Salon Chicha</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
                  {selectedProduct ? 'Enregistrer les modifications' : "Enregistrer l'article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showComptage && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div onClick={() => setShowComptage(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
           <div className="w-full max-w-lg bg-white p-10 md:p-12 rounded-[2.5rem] relative border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="mb-12">
                  <div className="flex items-center gap-8 mb-8">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl shadow-sm">{selectedProduct.emoji}</div>
                      <div>
                          <p className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest mb-2">Régularisation</p>
                          <h3 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight leading-none">{selectedProduct.nom}</h3>
                      </div>
                  </div>
              </div>

              <div className="space-y-10">
                  <div className="bg-slate-50 p-8 rounded-3xl flex justify-between items-center border border-slate-100">
                      <div className="text-center flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Théorique</p>
                          <p className="text-3xl font-black text-[#1E3A8A]">{selectedProduct.stockTotal}</p>
                      </div>
                      <div className="w-px h-12 bg-slate-200" />
                      <div className="text-center flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Écart Audit</p>
                          <p className={`text-3xl font-black ${stockReel - selectedProduct.stockTotal < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {stockReel - selectedProduct.stockTotal > 0 ? '+' : ''}{stockReel - selectedProduct.stockTotal}
                          </p>
                      </div>
                  </div>

                  <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 text-center">Quantité physique constatée</label>
                      <input type="number" autoFocus value={stockReel} onChange={(e) => setStockReel(Number(e.target.value))}
                          className="w-full h-20 bg-slate-50 border border-slate-200 rounded-2xl text-center text-5xl font-black text-[#1E3A8A] outline-none focus:border-[#1E3A8A] focus:bg-white transition-all shadow-sm" />
                  </div>

                  <div className="flex gap-4 pt-6">
                      <button onClick={() => setShowComptage(false)} className="flex-1 h-16 text-slate-400 font-bold text-sm">Abandonner</button>
                      <button onClick={validerComptage} className="flex-1 h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
                          Valider l'audit
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {showRecetteModal && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
           <div onClick={() => setShowRecetteModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
           <div className="w-full max-w-5xl bg-white p-10 md:p-16 rounded-[3rem] relative border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowRecetteModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
              
              <div className="mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[#FF7A00] text-[10px] font-bold uppercase tracking-widest mb-6">
                    <Zap size={14} />
                    Configuration Technique
                  </div>
                  <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight mb-4">Composition : {selectedProduct.nom}</h3>
                  <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                    Définissez les matières premières et ingrédients impactés lors de la production ou la vente de cet article.
                  </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <History size={20} className="text-[#1E3A8A]" />
                    <h4 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-widest">Ingrédients Actuels</h4>
                  </div>
                  <div className="bg-slate-50/50 p-2 min-h-[350px] rounded-[2rem] border border-slate-100 overflow-y-auto no-scrollbar">
                    {((selectedProduct as any).recette || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 p-12 text-center">
                        <Plus size={48} className="mb-6 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Aucun ingrédient lié</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {((selectedProduct as any).recette || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group/item transition-all hover:scale-[1.02]">
                            <div>
                              <p className="font-bold text-[#1E3A8A] text-base leading-tight mb-1">{item.nom}</p>
                              <p className="text-[10px] text-[#FF7A00] font-bold uppercase tracking-widest">Sortie stock : {item.quantite} unité(s)</p>
                            </div>
                            <button onClick={() => supprimerIngredientRecette(idx)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <Filter size={20} className="text-[#1E3A8A]" />
                    <h4 className="text-sm font-bold text-[#1E3A8A] uppercase tracking-widest">Lier une ressource</h4>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Matière première / Ingrédient</label>
                      <select 
                        value={ingredientSelectionne} 
                        onChange={(e) => setIngredientSelectionne(e.target.value)}
                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-[#1E3A8A] text-sm appearance-none focus:bg-white shadow-sm"
                      >
                        <option value="">Sélectionner dans l'inventaire...</option>
                        {produits.filter(p => p.id !== selectedProduct.id).map(p => (
                          <option key={p.id} value={p.id}>{p.nom}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Quantité à déduire</label>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number" 
                          value={quantiteIngredient} 
                          onChange={(e) => setQuantiteIngredient(Number(e.target.value))}
                          className="flex-1 h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-bold text-[#1E3A8A] text-lg shadow-sm" 
                        />
                        <button 
                          onClick={ajouterIngredientRecette}
                          disabled={!ingredientSelectionne}
                          className="h-16 px-10 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm disabled:opacity-20 transition-all hover:bg-blue-800 shadow-lg shadow-blue-900/10 flex items-center gap-3"
                        >
                          Lier <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                    <div className="flex gap-5">
                      <AlertCircle className="text-[#1E3A8A] shrink-0" size={24} />
                      <p className="text-xs font-semibold text-blue-900/70 leading-relaxed">
                        Le stock de cet ingrédient sera automatiquement déduit à chaque vente de {selectedProduct.nom}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowRecetteModal(false)} className="px-12 py-5 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3">
                      Terminer la configuration <CheckCircle2 size={18} />
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

export default GestionStocks;
