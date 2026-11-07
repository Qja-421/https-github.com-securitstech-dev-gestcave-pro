import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Receipt, ShoppingBag, 
  Settings, LogOut, TrendingUp, AlertTriangle, 
  Clock, CheckCircle2, DollarSign, Calculator,
  ChevronRight, Calendar, ArrowUpRight
} from 'lucide-react';
import ModalRapportFiscal from '../components/modals/ModalRapportFiscal';

const PageDemoScenario = () => {
  const [showFiscalModal, setShowFiscalModal] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Simulé */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col p-8">
        <div className="mb-12 px-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 font-black text-xl">E</div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Étoile du Congo</h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SaaS Edition</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center gap-4 font-black text-[11px] uppercase tracking-widest shadow-sm">
            <LayoutDashboard size={20} /> Tableau de Bord
          </div>
          <div className="p-4 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center gap-4 font-black text-[11px] uppercase tracking-widest transition-all">
            <Clock size={20} /> Sessions
          </div>
          <div className="p-4 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center gap-4 font-black text-[11px] uppercase tracking-widest transition-all">
            <Receipt size={20} /> Finance
          </div>
        </nav>

        <div className="mt-auto p-4 bg-slate-900 rounded-[2rem] text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xs">AD</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connecté en tant que</p>
              <p className="text-sm font-black uppercase">Admin Manager</p>
            </div>
          </div>
          <button className="w-full h-12 bg-white/10 hover:bg-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Déconnexion</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 no-scrollbar">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Scénario 17 Juin 2025 Simulé</div>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Vue d'Exploitation</h2>
            <p className="text-slate-500 font-medium">Récapitulatif de la journée opérationnelle à l'Étoile du Congo.</p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => setShowFiscalModal(true)} className="h-16 px-8 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 flex items-center gap-3">
              <Calculator size={20} /> Rapport Fiscal Mensuel
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CA Ventes (T02 + T05)</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black">25 500 F</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={16} /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Commandes Servies</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black">2</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CheckCircle2 size={16} /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Dépenses Journée</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-rose-600">59 500 F</p>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ArrowUpRight size={16} /></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Stock Primus Restant</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black">354</p>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={16} /></div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-[12px] uppercase tracking-widest text-slate-900">Journal des Ventes Simulé</h3>
                <span className="text-[10px] font-bold text-slate-400">17 Juin 2025</span>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5">Heure</th>
                      <th className="px-8 py-5">Table</th>
                      <th className="px-8 py-5">Détails</th>
                      <th className="px-8 py-5 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-sm">
                    <tr className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6 text-slate-400">13:30</td>
                      <td className="px-8 py-6">Table T02</td>
                      <td className="px-8 py-6 text-slate-600">6 Primus, 1 Poulet, 1 Riz, 1 JB</td>
                      <td className="px-8 py-6 text-right font-black">20 300 F</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-6 text-slate-400">13:55</td>
                      <td className="px-8 py-6">Table T05</td>
                      <td className="px-8 py-6 text-slate-600">2 Coca, 1 Poisson, 1 Eau</td>
                      <td className="px-8 py-6 text-right font-black">5 200 F</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <h3 className="font-black text-[12px] uppercase tracking-widest mb-8 text-slate-500">Statut Session</h3>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xl font-black">SESSION CLÔTURÉE</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ouverture</span>
                  <span className="font-bold">07:30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Clôture</span>
                  <span className="font-bold">23:00</span>
                </div>
                <div className="flex justify-between text-sm pt-4 border-t border-white/10">
                  <span className="text-slate-500">Recette Totale</span>
                  <span className="font-bold text-emerald-400">25 500 F</span>
                </div>
              </div>
              <button className="w-full h-14 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                <Download size={18} /> Télécharger Rapport
              </button>
            </div>
          </div>
        </div>
      </main>

      <ModalRapportFiscal 
        isOpen={showFiscalModal} 
        onClose={() => setShowFiscalModal(false)} 
        defaultCA={25500} 
      />
    </div>
  );
};

const Download = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

export default PageDemoScenario;
