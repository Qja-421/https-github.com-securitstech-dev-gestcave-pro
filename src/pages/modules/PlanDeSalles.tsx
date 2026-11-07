import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, ShoppingBag, Package, X, Receipt, 
  CheckCircle2, CreditCard, Layout, MapPin, Wine, Info, ArrowUpRight, Activity,
  Smartphone, Banknote, AlertTriangle, AlertCircle, Loader2, DoorOpen, MoreVertical, Search, Settings,
  Sparkles, Coffee, Beer, Utensils, Lock
} from 'lucide-react';
import { usePOSStore, imprimerTicket } from '../../store/posStore';
import type { TablePlan, Commande } from '../../store/posStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

// ----------- Types locaux -----------
type EtapeModal = 'detail' | 'paiement' | 'liberation';

const PlanDeSalles = () => {
  const { tables, commandes } = usePOSStore();
  const navigate = useNavigate();
  const [tableSelectionnee, setTableSelectionnee] = useState<{table: TablePlan, commande?: Commande} | null>(null);
  const [etapeModal, setEtapeModal] = useState<EtapeModal>('detail');
  const zones = ['salle', 'terrasse', 'vip', 'comptoir'] as const;

  const totalActif = commandes.filter(c => c.statut !== 'payee').reduce((acc, c) => acc + (c.total || 0), 0);
  const tablesOccupees = tables.filter(t => t.statut === 'occupee').length;
  const tauxOccupation = Math.round((tablesOccupees / (tables.length || 1)) * 100);

  const renderTable = (table: TablePlan) => {
    const commande = commandes.find(c => c.tableId === table.id && c.statut !== 'payee');
    const isOccupee = table.statut === 'occupee';
    const isEnAttente = table.statut === 'en_attente_paiement';

    return (
      <button
        key={table.id}
        onClick={() => setTableSelectionnee({ table, commande })}
        className={`relative aspect-square p-5 rounded-[2.5rem] flex flex-col items-center justify-between border transition-all shadow-xl group hover:scale-105 ${
          isOccupee 
            ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-blue-900/20' 
            : isEnAttente
            ? 'bg-orange-50 border-orange-200 text-orange-900 shadow-orange-900/10'
            : 'bg-white border-slate-100 text-slate-700 shadow-blue-900/5 hover:border-blue-200'
        }`}
      >
        <div className={`text-[9px] font-bold uppercase tracking-widest ${isOccupee ? 'text-white/60' : 'text-slate-400'}`}>
          {table.statut.replace('_', ' ')}
        </div>

        <div className="text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors ${
             isOccupee ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-300'
          }`}>
             {table.zone === 'vip' ? <Sparkles size={24} /> : table.zone === 'comptoir' ? <Beer size={24} /> : <Utensils size={24} />}
          </div>
          <h3 className={`text-xl font-black tracking-tight leading-none ${isOccupee ? 'text-white' : 'text-[#1E3A8A]'}`}>
            {table.nom.split(' ')[1] || table.nom}
          </h3>
          {isOccupee && commande && (
            <div className="mt-2 space-y-1">
              <p className="text-orange-400 font-extrabold text-sm tracking-tight">{(commande.total || 0).toLocaleString()} <span className="text-[10px] opacity-60">XAF</span></p>
              <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 mx-auto w-fit">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 truncate max-w-[80px]">{commande.serveurNom?.split(' ')[0]}</p>
              </div>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isOccupee ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
          <Users size={12} className={isOccupee ? 'text-white/40' : 'text-slate-300'} />
          <span className={`text-[10px] font-bold ${isOccupee ? 'text-white' : 'text-slate-500'}`}>{table.capacite} pers.</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Executive Infrastructure Stats */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatPill label="Cash Encaissé (Session)" value={`${commandes.filter(c => c.statut === 'payee' || (c.montantPaye || 0) > 0).reduce((acc, c) => acc + (c.montantPaye || 0), 0).toLocaleString()} F`} icon={<Banknote size={24} />} color="emerald" />
          <StatPill label="Dettes / Crédits" value={`${commandes.reduce((acc, c) => acc + (c.montantRestant || 0), 0).toLocaleString()} F`} icon={<AlertCircle size={24} />} color="rose" />
          <StatPill label="Ventes Latentes" value={`${totalActif.toLocaleString()} F`} icon={<Activity size={24} />} color="blue" />
          <StatPill label="Occupation" value={`${tauxOccupation}% (${tablesOccupees} tables)`} icon={<Users size={24} />} color="orange" />
        </div>
        <button 
          onClick={() => navigate('/tableau-de-bord/tables')}
          className="lg:w-[220px] bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-blue-900/5 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] group-hover:bg-blue-50 transition-colors shadow-inner">
             <Settings size={24} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</span>
        </button>
      </div>

      <div className="space-y-10">
        {zones.map(zone => (
          <section key={zone} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center gap-6 mb-10">
               <div className="w-2 h-8 bg-[#1E3A8A] rounded-full" />
               <h2 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Zone {zone}</h2>
               <div className="h-[1px] flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6">
              {tables.filter(t => t.zone === zone).map(renderTable)}
            </div>
          </section>
        ))}
      </div>

      {/* Protocol Audit Modal */}
      {tableSelectionnee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => setTableSelectionnee(null)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 border border-white/20">
            
            <header className="p-10 md:p-12 bg-slate-50 flex justify-between items-start border-b border-slate-100">
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${tableSelectionnee.table.statut === 'libre' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-900/20'}`}>
                      {tableSelectionnee.table.statut.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">{tableSelectionnee.table.zone}</span>
                 </div>
                 <h2 className="text-5xl font-black text-[#1E3A8A] tracking-tighter leading-none">{tableSelectionnee.table.nom}</h2>
              </div>
              <button onClick={() => setTableSelectionnee(null)} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm">
                <X size={28} />
              </button>
            </header>

            <div className="p-10 md:p-12">
              {tableSelectionnee.commande ? (
                <div className="space-y-12">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-10">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Service assuré par</p>
                        <p className="text-3xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">{tableSelectionnee.commande.serveurNom}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Temps écoulé</p>
                        <p className="text-3xl font-extrabold text-[#1E3A8A] uppercase flex items-center justify-end gap-3 tracking-tight">
                           <Clock size={24} className="text-orange-500" />
                           {Math.floor((Date.now() - new Date(tableSelectionnee.commande.dateOuverture).getTime()) / 60000)} MIN
                        </p>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8 px-2">Consommations actives</h3>
                     <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 no-scrollbar">
                        {tableSelectionnee.commande.lignes.map((ligne, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
                             <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center font-extrabold text-lg">
                                   {ligne.quantite}
                                </div>
                                <span className="font-bold text-[#1E3A8A] uppercase text-sm tracking-tight">{ligne.produitNom}</span>
                             </div>
                             <span className="font-black text-[#1E3A8A] tracking-tight text-xl">{(ligne.prixUnitaire * ligne.quantite).toLocaleString()} <span className="text-[10px] opacity-30 uppercase">XAF</span></span>
                          </div>
                        ))}
                     </div>
                     <div className="mt-10 pt-10 border-t-2 border-slate-200/50 flex justify-between items-end px-2">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pb-1">Total théorique</span>
                        <span className="text-6xl font-black text-[#1E3A8A] tracking-tighter">{(tableSelectionnee.commande.total || 0).toLocaleString()} <span className="text-[18px] opacity-30 font-bold uppercase">XAF</span></span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center">
                  <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner text-slate-200">
                    <DoorOpen size={64} />
                  </div>
                  <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight">Table Libre</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-4">Aucune consommation enregistrée sur cette table.</p>
                </div>
              )}
            </div>

            {tableSelectionnee.commande && (
              <div className="p-10 md:p-12 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button className="h-20 bg-slate-100 text-slate-500 rounded-[2rem] font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-4">
                    <Receipt size={24} /> Note Intermédiaire
                 </button>
                 <button onClick={() => navigate('/tableau-de-bord/caisse')} className="h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4">
                    <CreditCard size={24} /> Passer à l'encaissement
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StatPill = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 flex items-center gap-5 md:gap-8 group hover:scale-[1.02] transition-all">
    <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-3xl shadow-lg transition-transform group-hover:rotate-12 ${
      color === 'blue' ? 'bg-blue-50 text-[#1E3A8A] shadow-blue-900/5' :
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-900/5' :
      color === 'rose' ? 'bg-rose-50 text-rose-600 shadow-rose-900/5' :
      'bg-orange-50 text-orange-500 shadow-orange-900/5'
    }`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none truncate">{value}</p>
    </div>
  </div>
);

export default PlanDeSalles;
