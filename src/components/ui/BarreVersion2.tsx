import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  UtensilsCrossed,
  ChefHat,
  Banknote,
  Clock,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Store,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BarreVersion2 = () => {
  const [minimise, setMinimise] = useState(false);
  const { activerModeDemo, profil } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const changerRole = (
    route: string,
    role: 'super_admin' | 'client_admin' | 'employe',
    nom: string,
    subRole: string
  ) => {
    activerModeDemo(role, nom, subRole);
    navigate(route);
    toast.success(`Accès V2.0 activé : ${nom}`, {
      icon: '⚡',
      style: {
        borderRadius: '16px',
        background: '#0F172A',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 'bold',
      },
    });
  };

  const currentPath = location.pathname;

  return (
    <aside aria-label="Contrôleur de navigation rapide" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-5xl pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-950/60 p-2 sm:p-2.5 text-white pointer-events-auto transition-all">
        {/* Barre principale */}
        <div className="flex items-center justify-between gap-2">
          {/* Badge V2.0 */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Sparkles size={16} className="animate-spin-slow" />
            </div>
            <div className="hidden md:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight text-white uppercase">GestCave</span>
                <span className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  V2.0 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {profil?.nom || 'Étoile du Congo'}
              </p>
            </div>
          </div>

          {/* Navigation rapide entre rôles */}
          {!minimise && (
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
              {/* Portail Public */}
              <button
                onClick={() => navigate('/')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath === '/'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Page d'accueil & Vitrine"
              >
                <Store size={14} className="text-indigo-400" />
                <span className="hidden sm:inline">Vitrine</span>
              </button>

              {/* Gérant / Tableau de bord */}
              <button
                onClick={() => changerRole('/tableau-de-bord', 'client_admin', 'Gérant Étoile du Congo', 'admin')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath.startsWith('/tableau-de-bord')
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Tableau de bord gérant"
              >
                <LayoutDashboard size={14} className="text-blue-400" />
                <span>Gérant</span>
              </button>

              {/* Serveur POS */}
              <button
                onClick={() => changerRole('/serveur', 'employe', 'Jean-Baptiste (Serveur)', 'serveur')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath === '/serveur'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="POS Serveur Prise de Commande"
              >
                <UtensilsCrossed size={14} className="text-orange-400" />
                <span>Serveur</span>
              </button>

              {/* KDS Cuisine */}
              <button
                onClick={() => changerRole('/cuisine', 'employe', 'Céleste (Cuisine & Bar)', 'cuisine')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath === '/cuisine'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Écran Cuisine / KDS"
              >
                <ChefHat size={14} className="text-emerald-400" />
                <span>Cuisine</span>
              </button>

              {/* Caisse */}
              <button
                onClick={() => changerRole('/caisse', 'employe', 'Rodrigue (Caisse)', 'caissier')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath === '/caisse'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Caisse Express & Encaissement"
              >
                <Banknote size={14} className="text-amber-400" />
                <span>Caisse</span>
              </button>

              {/* Super Admin */}
              <button
                onClick={() => changerRole('/super-admin', 'super_admin', 'Super Administrateur SaaS', 'super_admin')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath.startsWith('/super-admin')
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Tableau Super Admin SaaS"
              >
                <ShieldAlert size={14} className="text-purple-400" />
                <span className="hidden lg:inline">Super Admin</span>
              </button>

              {/* Pointage */}
              <button
                onClick={() => navigate('/pointage/etoile-du-congo-id')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath.startsWith('/pointage')
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Badgeuse Terminal"
              >
                <Clock size={14} className="text-teal-400" />
                <span className="hidden sm:inline">Pointage</span>
              </button>

              {/* Démo Scénario */}
              <button
                onClick={() => navigate('/demo-scenario')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentPath === '/demo-scenario'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                }`}
                title="Simulation Scénario"
              >
                <FlaskConical size={14} className="text-rose-400" />
                <span className="hidden lg:inline">Scénario</span>
              </button>
            </div>
          )}

          {/* Toggle minimiser */}
          <div className="flex items-center gap-1 pr-1">
            <button
              onClick={() => setMinimise(!minimise)}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title={minimise ? 'Agrandir la barre V2.0' : 'Minimiser la barre'}
            >
              {minimise ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
