import React from 'react';
import { 
  Home, ShoppingBag, Users, Landmark, 
  Settings, ChevronLeft, ChevronRight,
  UserCheck, AlertCircle, Calendar, Target,
  LogOut, Printer, Package, ClipboardList, Truck,
  BookOpen, ShieldCheck
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <Home size={20} />, path: '/tableau-de-bord' },
  { id: 'comptabilite', label: 'Comptabilité & Analytique', icon: <BookOpen size={20} className="text-blue-500" />, path: '/tableau-de-bord?tab=comptabilite' },
  { id: 'securite-audit', label: 'Sécurité & Audit Admin', icon: <ShieldCheck size={20} className="text-emerald-500" />, path: '/tableau-de-bord?tab=securite-audit' },
  { id: 'stocks', label: 'Articles & Stocks', icon: <Package size={20} />, path: '/tableau-de-bord?tab=stocks', solo: true },
  { id: 'achats', label: 'Achats Fournisseurs', icon: <Truck size={20} />, path: '/tableau-de-bord?tab=achats', solo: true },
  { id: 'saisie-journaliere', label: 'Saisie Directe', icon: <ClipboardList size={20} />, path: '/tableau-de-bord?tab=saisie-journaliere', solo: true },
  { id: 'caisse-express', label: 'Caisse Express', icon: <ShoppingBag size={20} />, path: '/tableau-de-bord?tab=caisse-express' },
  { id: 'caisse', label: 'Caisse Avancée', icon: <Landmark size={20} />, path: '/choisir-role' },
  { id: 'finances', label: 'Trésorerie & Flux', icon: <Landmark size={20} />, path: '/tableau-de-bord?tab=finances' },
  { id: 'crm', label: 'CRM & Clients', icon: <UserCheck size={20} />, path: '/tableau-de-bord?tab=crm' },
  { id: 'equipe', label: 'RH & Personnel', icon: <Users size={20} />, path: '/tableau-de-bord?tab=equipe' },
  { id: 'planning', label: 'Planning Quarts', icon: <Calendar size={20} />, path: '/tableau-de-bord?tab=planning' },
  { id: 'hybride', label: 'Mode Hybride (Papier)', icon: <Printer size={20} />, path: '/tableau-de-bord?tab=hybride' },
  { id: 'ia', label: 'IA Analytique V2.0', icon: <Target size={20} className="text-orange-500" />, path: '/tableau-de-bord?tab=ia' },
  { id: 'objectifs', label: 'Objectifs Vente', icon: <Target size={20} />, path: '/tableau-de-bord?tab=objectifs' },
  { id: 'alertes', label: 'Centre Alertes', icon: <AlertCircle size={20} />, path: '/tableau-de-bord?tab=alertes' },
  { id: 'parametres', label: 'Configuration', icon: <Settings size={20} />, path: '/tableau-de-bord?tab=parametres' },
];

export const Sidebar = ({ activeTab, onTabChange, isSolo = false }: { activeTab: string, onTabChange: (id: string) => void, isSolo?: boolean }) => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { profil, deconnexion } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await deconnexion();
      navigate('/connexion');
    }
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} flex flex-col`}>
      {/* Header */}
      <div className="h-[72px] flex items-center justify-between px-4 border-b border-subtle shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-black text-sm">
              G
            </div>
            <span className="font-extrabold text-brand tracking-tight text-lg">
              Gest<span className="text-accent">Cave</span><span className="text-xs opacity-50 ml-1">v2.1</span>
            </span>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 text-text-muted hover:text-brand hover:bg-brand-light rounded-lg transition-all"
          title={sidebarCollapsed ? "Déployer le menu" : "Réduire le menu"}
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile Summary */}
      {!sidebarCollapsed && profil && (
        <div className="p-4 mx-4 mt-4 bg-surface-3 rounded-xl border border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-light text-brand rounded-full flex items-center justify-center font-bold uppercase">
              {profil.nom?.substring(0, 2) || 'AD'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-text-primary truncate">{profil.nom}</p>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">{profil.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
        {navItems.filter(item => !isSolo || item.id === 'dashboard' || item.solo).map(item => {
          const isActive = activeTab === item.id || (item.id === 'dashboard' && !activeTab);
          
          if (item.path.includes('?tab=')) {
            const tabId = item.path.split('?tab=')[1];
            return (
              <button 
                key={item.id}
                onClick={() => onTabChange(tabId)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="nav-icon">{item.icon}</div>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          } else {
            return (
              <Link 
                key={item.id}
                to={item.path}
                className="sidebar-nav-item"
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="nav-icon">{item.icon}</div>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          }
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-subtle shrink-0">
        <button 
          onClick={handleLogout}
          className="sidebar-nav-item text-danger hover:text-white hover:bg-danger"
          title={sidebarCollapsed ? "Déconnexion" : undefined}
        >
          <div className="nav-icon"><LogOut size={20} /></div>
          {!sidebarCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};
