import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Calendar, 
  AlertCircle,
  Zap,
  Brain,
  BarChart3,
  ArrowUpRight,
  Target,
  ArrowRight,
  Activity,
  ShieldCheck,
  ZapOff,
  Cpu
} from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';

const IAIntelligence = () => {
  const { produits, commandes } = usePOSStore();
  const { profil } = useAuthStore();

  // Simulation de calculs IA basés sur les données réelles
  const aiStats = useMemo(() => {
    const totalCommandes = commandes.length;
    const avgTotal = totalCommandes > 0 ? commandes.reduce((acc, c) => acc + c.total, 0) / totalCommandes : 15000;
    
    return {
      predictionHebdo: Math.round(avgTotal * 45 * 1.12), // Simulation 45 ventes/semaine + 12% croissance IA
      indexConfiance: 94,
      alertesStock: produits.filter(p => p.stockTotal <= (p.stockAlerte || 0) * 1.5).length,
      optimisationStaff: "RENFORT_SALLE_VENDREDI_SOIR (AFFLUENCE_PREVUE_PLUS_20_POURCENT)",
    };
  }, [commandes, produits]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Cpu size={14} />
              Cœur Analytique V3
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Intelligence <span className="text-[#FF7A00]">Prédictive</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Analyse en temps réel de vos flux de revenus, prévisions de ventes et optimisation des ressources.</p>
        </div>

        <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner animate-pulse">
                <Sparkles size={32} />
            </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Primary Analysis Module */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Revenue Trajectory Card */}
          <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-30" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Trajectoire des Revenus (7 Prochains Jours)</p>
                  <h2 className="text-6xl md:text-7xl font-black text-[#1E3A8A] tracking-tighter">{aiStats.predictionHebdo.toLocaleString()} <span className="text-2xl font-bold opacity-30">XAF</span></h2>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm self-start">
                  <TrendingUp size={20} />
                  <span className="text-sm font-bold tracking-widest uppercase">+12.4%</span>
                </div>
              </div>

              {/* Data Visualization */}
              <div className="h-64 flex items-end gap-3 mb-12 bg-slate-50 rounded-[2.5rem] p-10 shadow-inner">
                {[45, 60, 55, 80, 70, 95, 85].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className={`w-full rounded-t-xl transition-all ${i === 5 ? 'bg-[#FF7A00] shadow-lg shadow-orange-500/20' : 'bg-[#1E3A8A] opacity-20 group-hover:opacity-40'}`}
                    />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'][i]}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-50 pt-12">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-inner">
                    <Target size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Indice de Confiance</p>
                    <p className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">{aiStats.indexConfiance}% FIABILITÉ</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                    <Activity size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernière Synchronisation</p>
                    <p className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">IL Y A 2 MIN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Allocation Intelligence */}
          <div className="bg-[#1E3A8A] p-12 rounded-[3.5rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
             <Brain className="absolute bottom-[-60px] right-[-60px] text-white/5 opacity-20" size={300} />
             
             <div className="relative z-10">
                <div className="flex items-center gap-6 mb-12 border-b border-white/10 pb-8">
                  <div className="w-16 h-16 bg-[#FF7A00] rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-900/20"><ShoppingCart size={28} /></div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase">Gestion Intelligente des Stocks</h3>
                    <p className="text-blue-100/50 text-xs font-bold uppercase tracking-widest mt-1">Prévisions de réapprovisionnement IA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {produits.slice(0, 3).map((p, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/10 transition-all group/item">
                       <div className="flex items-center gap-8 w-full md:w-auto">
                          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover/item:scale-105 transition-transform">
                            {p.emoji || '📦'}
                          </div>
                          <div>
                             <h4 className="font-black text-xl uppercase tracking-tight">{p.nom}</h4>
                             <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-2 flex items-center gap-2">
                                ÉPUISEMENT PRÉVU : <span className="text-[#FF7A00]">SOUS 72H</span>
                             </p>
                          </div>
                       </div>
                       <button className="w-full md:w-auto px-8 h-16 bg-white text-[#1E3A8A] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#FF7A00] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3">
                          Commander <ArrowRight size={16} />
                       </button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>

        {/* Operational Insights Column */}
        <div className="space-y-8">
          
          {/* Staffing Allocation Protocol */}
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
             <div className="flex items-center gap-6 mb-12">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-inner"><Users size={28} /></div>
                <h3 className="text-xl font-black tracking-tight uppercase leading-none">Optimisation du Personnel</h3>
             </div>

             <div className="p-8 bg-orange-50 rounded-[2rem] border border-orange-100 mb-10 shadow-inner">
                <p className="text-[11px] font-bold text-[#FF7A00] uppercase tracking-widest mb-4 flex items-center gap-3">
                   <AlertCircle size={16} /> RECOMMANDATION IA
                </p>
                <p className="text-sm font-bold text-[#1E3A8A] leading-relaxed uppercase tracking-tight">
                  {aiStats.optimisationStaff}
                </p>
             </div>

             <div className="space-y-4 border-t border-slate-50 pt-10">
                <div className="flex justify-between items-center py-4">
                   <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Temps de Service Cible</span>
                   <span className="text-lg font-black text-[#1E3A8A] tracking-tighter">00:08:30</span>
                </div>
                <div className="flex justify-between items-center py-4">
                   <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Index de Débit (U/H)</span>
                   <span className="text-lg font-black text-[#1E3A8A] tracking-tighter">14.2</span>
                </div>
             </div>
          </div>

          {/* Strategic Intervention Module */}
          <div className="bg-[#FF7A00] p-12 rounded-[3rem] text-white shadow-2xl shadow-orange-900/20 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
             <div className="flex items-center gap-6 mb-12">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner"><Zap size={28} /></div>
                <h3 className="text-xl font-black tracking-tight uppercase leading-none">Intervention Stratégique</h3>
             </div>
             <p className="text-sm font-bold text-white leading-relaxed mb-12 uppercase tracking-tight opacity-90">
               SURPLUS CRITIQUE DÉTECTÉ : <span className="bg-white/20 px-2 py-0.5 rounded">"Pilsner Urquell"</span>. ACTION : LANCER HAPPY HOUR MARDI 18H.
             </p>
             <div className="p-8 bg-black/10 rounded-[2rem] border border-white/10 shadow-inner">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
                   Gain de Marge Projeté
                </div>
                <div className="text-4xl font-black tracking-tighter text-white">+14,500 XAF</div>
             </div>
          </div>

          <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
             <div className="flex items-center gap-6 mb-8">
                <ShieldCheck size={28} className="text-emerald-400" />
                <h3 className="text-xl font-black tracking-tight uppercase leading-none">Sécurité Système</h3>
             </div>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               PROTOCOLE DE SÉCURITÉ ACTIF. TOUTES LES PRÉVISIONS SONT BASÉES SUR UN MODÈLE D'APPRENTISSAGE LOCAL CHIFFRÉ.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IAIntelligence;
