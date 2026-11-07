import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Plus, Trash2, Edit3, Move, 
  Save, Grid, MapPin, Users, X, 
  ChevronRight, Crown, Sun, Sparkles,
  Map, Activity, ArrowRight, Info, Coffee
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Table {
  id: string;
  nom: string;
  capacite: number;
  zone: 'salle' | 'terrasse' | 'vip' | 'comptoir';
  statut: 'libre' | 'occupee' | 'en_attente_paiement';
  x: number;
  y: number;
}

const GestionTables = () => {
  const { profil } = useAuthStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [nom, setNom] = useState('');
  const [capacite, setCapacite] = useState(4);
  const [zone, setZone] = useState<'salle' | 'terrasse' | 'vip' | 'comptoir'>('salle');

  useEffect(() => {
    if (!profil?.etablissement_id) return;
    const q = query(collection(db, 'tables'), where('etablissement_id', '==', profil.etablissement_id));
    const unsub = onSnapshot(
      q, 
      (snap) => {
        setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Table[]);
        setLoading(false);
      },
      (err) => {
        console.warn("tables listener error:", err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [profil?.etablissement_id]);

  const ajouterTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tables'), {
        nom, capacite: Number(capacite), zone, statut: 'libre', x: 50, y: 50,
        etablissement_id: profil?.etablissement_id || '', created_at: new Date().toISOString()
      });
      toast.success(`Table ${nom} ajoutée avec succès`);
      setShowModal(false); setNom(''); setCapacite(4);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const supprimerTable = async (id: string, nomTable: string) => {
    if (window.confirm(`Supprimer la table ${nomTable}?`)) {
      try {
        await deleteDoc(doc(db, 'tables', id));
        toast.success("Table supprimée");
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const totalCapacite = tables.reduce((acc, t) => acc + (t.capacite || 0), 0);
  const tablesParZone = {
      salle: tables.filter(t => t.zone === 'salle').length,
      terrasse: tables.filter(t => t.zone === 'terrasse').length,
      vip: tables.filter(t => t.zone === 'vip').length,
      comptoir: tables.filter(t => t.zone === 'comptoir').length,
  };

  const zoneStyle = (z: string) => {
    if (z === 'vip') return { badge: 'bg-[#FF7A00] text-white', icon: 'bg-orange-50 text-[#FF7A00]', card: 'hover:border-orange-200' };
    if (z === 'terrasse') return { badge: 'bg-[#1E3A8A] text-white', icon: 'bg-blue-50 text-[#1E3A8A]', card: 'hover:border-blue-200' };
    if (z === 'comptoir') return { badge: 'bg-slate-900 text-white', icon: 'bg-slate-100 text-slate-900', card: 'hover:border-slate-900/10' };
    return { badge: 'bg-emerald-500 text-white', icon: 'bg-emerald-50 text-emerald-500', card: 'hover:border-emerald-200' };
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Map size={14} />
              Architecture des Salles
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Gestion des <span className="text-[#FF7A00]">Tables</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Organisez vos zones de service, gérez la capacité d'accueil et la topologie de votre salle.</p>
        </div>

        <button onClick={() => setShowModal(true)}
          className="px-8 h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm hover:bg-blue-800 transition-all flex items-center gap-4 shadow-2xl shadow-blue-900/20 relative z-10">
          <Plus size={20} /> Ajouter une Table
        </button>
      </header>

      {/* Resource Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-6 px-1">Capacité Totale</p>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black tracking-tighter">{totalCapacite}</span>
                <span className="text-sm font-bold uppercase text-white/30 tracking-tight">Places</span>
              </div>
          </div>
          {[
            { label: 'SALLE PRINCIPALE', val: tablesParZone.salle, icon: <Grid size={24} />, color: 'bg-emerald-50 text-emerald-500' },
            { label: 'TERRASSE', val: tablesParZone.terrasse, icon: <Sun size={24} />, color: 'bg-blue-50 text-[#1E3A8A]' },
            { label: 'ZONE VIP', val: tablesParZone.vip, icon: <Crown size={24} />, color: 'bg-orange-50 text-[#FF7A00]' },
          ].map(s => (
            <div key={s.label} className="bg-white p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-between shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 ${s.color} rounded-2xl shadow-inner flex items-center justify-center transition-transform group-hover:scale-110`}>{s.icon}</div>
                    <p className="text-4xl font-black text-[#1E3A8A] tracking-tighter">{s.val}</p>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-8 px-1">{s.label}</p>
            </div>
          ))}
      </div>

      {/* Node Registry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tables.map((table) => {
              const s = zoneStyle(table.zone);
              return (
                <div key={table.id}
                  className={`bg-white p-8 rounded-[3rem] border border-slate-100 ${s.card} transition-all group relative shadow-xl shadow-blue-900/5 flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className={`w-14 h-14 ${s.icon} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform`}>
                      <Coffee size={24} />
                    </div>
                    <span className={`text-[9px] font-bold px-4 py-2 rounded-full uppercase tracking-widest ${s.badge} shadow-sm`}>
                      {table.zone}
                    </span>
                  </div>

                  <div className="mb-10 px-2">
                      <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">{table.nom}</h3>
                      <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                          <Users size={14} className="text-blue-200" /> {table.capacite} Personnes
                      </div>
                  </div>

                  <div className="flex gap-2 pt-8 border-t border-slate-50">
                    <button className="flex-1 h-14 bg-slate-50 text-[#1E3A8A] rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1E3A8A] hover:text-white transition-all">
                      Modifier
                    </button>
                    <button onClick={() => supprimerTable(table.id, table.nom)}
                      className="w-14 h-14 bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}

        {tables.length === 0 && !loading && (
          <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <MapPin size={48} className="text-slate-100" />
            </div>
            <h3 className="text-3xl font-black text-slate-300 uppercase tracking-widest">Aucune Table</h3>
            <p className="text-slate-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Cliquez sur "Ajouter une Table" pour commencer la configuration.</p>
          </div>
        )}
      </div>

      {/* Protocol Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-12 md:p-16 shadow-2xl relative animate-in zoom-in-95 duration-500 border border-white/20">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all"><X size={24} /></button>
            <div className="mb-12">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-10 shadow-inner"><Layout size={32} className="text-[#1E3A8A]" /></div>
                <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight uppercase leading-none">Nouvelle Table</h3>
                <p className="text-slate-500 font-medium text-lg mt-4">Définissez les propriétés de votre nouvel emplacement.</p>
            </div>

            <form onSubmit={ajouterTable} className="space-y-8">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Identifiant / Nom</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Table 01, VIP 02..." required
                  className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm placeholder:text-slate-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Nombre de places</label>
                  <input type="number" value={capacite} onChange={(e) => setCapacite(Number(e.target.value))} min="1" required
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none font-black text-[#1E3A8A] text-center text-3xl shadow-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Zone de service</label>
                  <select value={zone} onChange={(e) => setZone(e.target.value as any)}
                    className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 outline-none font-bold text-[#1E3A8A] text-xs uppercase tracking-widest shadow-sm">
                    <option value="salle">Salle Principale</option>
                    <option value="terrasse">Terrasse</option>
                    <option value="vip">Zone VIP</option>
                    <option value="comptoir">Comptoir</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 mt-6">
                Enregistrer la table <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionTables;
