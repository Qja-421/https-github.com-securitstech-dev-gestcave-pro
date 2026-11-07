import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, ShoppingCart, Plus, Calendar, Package, 
  ArrowLeft, Save, Truck, Receipt, TrendingUp, X, 
  ChevronRight, Info, Download, ArrowUpRight,
  Sparkles, History, Box, DollarSign, Wallet,
  ArrowRight, Search, Filter, RefreshCcw
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, writeBatch, increment } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import type { Produit } from '../../store/posStore';
import toast from 'react-hot-toast';

interface Achat {
    id: string;
    produitNom: string;
    produitId: string;
    quantiteSaisie: number;
    quantiteUnites: number;
    modeAchat: 'casier' | 'bouteille';
    prixUnitaire: number;
    total: number;
    date: string;
    fournisseur?: string;
}

const GestionAchats = () => {
    const { profil, etablissementSimuleId } = useAuthStore();
    const etablissementId = etablissementSimuleId || profil?.etablissement_id;
    const [achats, setAchats] = useState<Achat[]>([]);
    const [loading, setLoading] = useState(true);
    const [produits, setProduits] = useState<Produit[]>([]);
    const [showForm, setShowForm] = useState(false);
    
    // Formulaire
    const [produitId, setProduitId] = useState('');
    const [modeAchat, setModeAchat] = useState<'casier' | 'bouteille'>('casier');
    const [quantite, setQuantite] = useState(1);
    const [prixAchat, setPrixAchat] = useState(0); 
    const [fournisseur, setFournisseur] = useState('');

    useEffect(() => {
        if (!etablissementId) {
            setLoading(false);
            return;
        }

        const qA = query(collection(db, 'achats'), where('etablissement_id', '==', etablissementId));
        const unsubA = onSnapshot(
            qA, 
            (snap) => {
                setAchats(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Achat[]);
                setLoading(false);
            },
            (err) => {
                console.warn("achats listener error:", err.message);
                setLoading(false);
            }
        );

        const qP = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId));
        const unsubP = onSnapshot(
            qP, 
            (snap) => {
                setProduits(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produit[]);
            },
            (err) => {
                console.warn("produits listener error:", err.message);
            }
        );

        return () => { unsubA(); unsubP(); };
    }, [etablissementId]);

    const enregistrerAchat = async (e: React.FormEvent) => {
        e.preventDefault();
        const produit = produits.find(p => p.id === produitId);
        if (!produit) return;

        const toastId = toast.loading("Mise à jour du stock...");

        try {
            const batch = writeBatch(db);
            const total = quantite * prixAchat;
            const quantiteUnites = modeAchat === 'casier' ? quantite * (produit.unitesParCasier || 1) : quantite;
            
            const achatRef = doc(collection(db, 'achats'));
            batch.set(achatRef, {
                produitId, produitNom: produit.nom, modeAchat,
                quantiteSaisie: quantite, quantiteUnites, prixUnitaire: prixAchat,
                total, fournisseur, date: new Date().toISOString(),
                etablissement_id: etablissementId
            });

            const produitRef = doc(db, 'produits', produitId);
            batch.update(produitRef, { stockTotal: increment(quantiteUnites) });

            const transactionRef = doc(collection(db, 'transactions_pos'));
            batch.set(transactionRef, {
                type: 'depense', total, date: new Date().toISOString(),
                description: `Approvisionnement: ${produit.nom} (+${quantiteUnites} u)`,
                etablissement_id: etablissementId, modePaiement: 'comptant'
            });

            await batch.commit();
            toast.success("Achat enregistré avec succès.", { id: toastId });
            setShowForm(false); setQuantite(1); setPrixAchat(0); setProduitId(''); setFournisseur('');
        } catch {
            toast.error("Échec de l'opération.", { id: toastId });
        }
    };

    const depensesMois = achats.filter(a => {
        const d = new Date(a.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((acc, a) => acc + (a.total || 0), 0);

    const dernierAchat = achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
                
                <div className="relative z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
                      <Truck size={14} />
                      Logistique & Achats
                   </div>
                   <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
                      Gestion des <span className="text-[#FF7A00]">Stocks</span>
                   </h1>
                   <p className="text-slate-500 font-medium text-lg max-w-md">Enregistrez vos achats de marchandises et mettez à jour votre inventaire en temps réel.</p>
                </div>

                {!showForm && (
                <button onClick={() => setShowForm(true)}
                    className="px-8 h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm hover:bg-blue-800 transition-all flex items-center gap-4 shadow-2xl shadow-blue-900/20 relative z-10">
                    <Plus size={20} /> Nouvel Achat
                </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-6 px-1">Dépenses du mois</p>
                    <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-black tracking-tighter text-orange-400">{depensesMois.toLocaleString()}</span>
                        <span className="text-lg font-bold text-white/30 tracking-tight uppercase">XAF</span>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 shadow-inner group-hover:bg-blue-100 transition-colors">
                        <Box size={24} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Volume d'achats</p>
                    <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-black text-[#1E3A8A] tracking-tighter">{achats.length}</span>
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Lots</span>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all overflow-hidden relative">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-8 shadow-inner group-hover:bg-orange-100 transition-colors">
                        <History size={24} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Dernier mouvement</p>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight truncate">{dernierAchat ? dernierAchat.produitNom : 'Aucun'}</span>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-2">{dernierAchat ? new Date(dernierAchat.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>

            {showForm ? (
                <div className="bg-white p-12 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 relative animate-in slide-in-from-bottom-10 duration-500">
                    <button onClick={() => setShowForm(false)} className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all"><X size={24} /></button>
                    
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[#1E3A8A] text-[10px] font-bold uppercase tracking-widest mb-6">
                           Entrée en stock
                        </div>
                        <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight uppercase leading-none">Nouvel Achat</h3>
                        <p className="text-slate-400 font-medium text-lg mt-4">Remplissez les détails de la livraison pour mettre à jour vos stocks.</p>
                    </div>

                    <form onSubmit={enregistrerAchat} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="col-span-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Produit concerné</label>
                            <select className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm" 
                                value={produitId} onChange={(e) => setProduitId(e.target.value)} required>
                                <option value="">SÉLECTIONNER UN ARTICLE...</option>
                                {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Stock: {p.stockTotal})</option>)}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Unité d'achat</label>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button type="button" onClick={() => setModeAchat('casier')}
                                    className={`flex-1 h-14 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${modeAchat === 'casier' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-white'}`}>Casiers</button>
                                <button type="button" onClick={() => setModeAchat('bouteille')}
                                    className={`flex-1 h-14 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${modeAchat === 'bouteille' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-white'}`}>Unités / Btle</button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Quantité</label>
                            <input type="number" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-black text-[#1E3A8A] text-2xl shadow-sm" min="1" required />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Prix d'achat unitaire (XAF)</label>
                            <input type="number" value={prixAchat} onChange={(e) => setPrixAchat(Number(e.target.value))}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-black text-[#1E3A8A] text-2xl shadow-sm" required />
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Fournisseur</label>
                            <input type="text" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)}
                                className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm placeholder:text-slate-200" placeholder="Ex: BRASSERIES, GUINNESS..." />
                        </div>

                        <div className="col-span-2 bg-slate-50 p-10 md:p-12 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 mt-6 shadow-inner">
                                <div className="text-center md:text-left">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">Total de l'investissement</p>
                                    <p className="text-5xl font-black text-[#1E3A8A] tracking-tighter">{(quantite * prixAchat).toLocaleString()} <span className="text-xl opacity-30">XAF</span></p>
                                </div>
                                <button type="submit" className="h-20 px-12 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center gap-4">
                                   Enregistrer l'achat <ArrowRight size={20} />
                                </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                    <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Registre des Achats</h3>
                        <div className="flex items-center gap-3">
                            <button className="px-5 py-2.5 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:text-[#1E3A8A] hover:bg-blue-50 transition-all flex items-center gap-2">
                               <Download size={14} /> Exporter
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest">Date & Heure</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest">Article</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest">Volume</th>
                                    <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {achats.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(achat => (
                                    <tr key={achat.id} className="hover:bg-slate-50 transition-all group">
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-bold text-[#1E3A8A] tracking-tight">{new Date(achat.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{new Date(achat.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="font-bold text-[#1E3A8A] text-lg uppercase tracking-tight leading-none mb-2">{achat.produitNom}</p>
                                            <div className="flex items-center gap-2">
                                                <Truck size={12} className="text-orange-400" />
                                                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{achat.fournisseur || 'Dépôt Central'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-2">
                                                <span className="bg-blue-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest w-fit border border-blue-100">
                                                   +{achat.quantiteSaisie} {achat.modeAchat === 'casier' ? 'Casiers' : 'Bouteilles'}
                                                </span>
                                                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">soit {achat.quantiteUnites} unités</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className="text-2xl font-black text-[#1E3A8A] tracking-tighter">{achat.total.toLocaleString()} <span className="text-[10px] opacity-30">XAF</span></span>
                                        </td>
                                    </tr>
                                ))}
                                {achats.length === 0 && (
                                   <tr>
                                       <td colSpan={4} className="px-10 py-32 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Aucun achat enregistré.</td>
                                   </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default GestionAchats;
