import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { SkeletonDashboard } from '../components/ui/SkeletonLoader';
import { useUIStore } from '../store/uiStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Lazy load modules for better performance
const DashboardAccueil = lazy(() => import('./modules/DashboardAccueil'));
const CaisseExpress = lazy(() => import('./modules/CaisseExpress'));
const GestionStocks = lazy(() => import('./modules/GestionStocks'));
const GestionAchats = lazy(() => import('./modules/GestionAchats'));
const SaisieJournaliere = lazy(() => import('./modules/SaisieJournaliere'));
const GestionEmployes = lazy(() => import('./modules/GestionEmployes'));
const GestionFinance = lazy(() => import('./modules/GestionFinance'));
const GestionCRM = lazy(() => import('./modules/GestionCRM'));
const PlanningEquipe = lazy(() => import('./modules/PlanningEquipe'));
const CentreAlertes = lazy(() => import('./modules/CentreAlertes'));
const GestionConformite = lazy(() => import('./modules/GestionConformite'));
const GestionEtablissement = lazy(() => import('./modules/GestionEtablissement'));
const ModuleDebug = lazy(() => import('./modules/ModuleDebug'));
const IAIntelligence = lazy(() => import('./modules/IAIntelligence'));
const ModeHybride = lazy(() => import('./modules/ModeHybride'));
const GrandLivre = lazy(() => import('./modules/GrandLivre'));
const ModuleSecuriteAdmin = lazy(() => import('./modules/ModuleSecuriteAdmin'));

const TableauClient = () => {
  const { profil, chargement, etablissementSimuleId } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSolo, setIsSolo] = useState(false);
  const { darkMode } = useUIStore();
  const soloTabs = ['dashboard', 'stocks', 'achats', 'saisie-journaliere'];

  useEffect(() => {
    if (!chargement && !profil) {
      navigate('/connexion');
      return;
    }

    if (profil && !['super_admin', 'admin', 'gerant'].includes(profil.role)) {
      navigate('/caisse-mode');
    }
  }, [profil, chargement, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    else setActiveTab('dashboard');
  }, [location]);

  useEffect(() => {
    // Audit de Sécurité: multi-tenant strict isolation
    const etablissementId = (profil?.role === 'super_admin' && etablissementSimuleId) ? etablissementSimuleId : profil?.etablissement_id;
    if (!etablissementId) {
      setIsSolo(false);
      return;
    }

    try {
      return onSnapshot(
        doc(db, 'etablissements', etablissementId),
        (snap) => {
          const data = snap.data();
          const modules = Array.isArray(data?.modules_actifs) ? data.modules_actifs : [];
          const plan = String(data?.subscription_plan || data?.plan || '').toLowerCase();
          setIsSolo(modules.includes('solo') || plan.includes('solo'));
        },
        (error) => {
          console.warn("etablissements listener inaccessible:", error.message);
          setIsSolo(false);
        }
      );
    } catch (e) {
      console.warn("Erreur souscription etablissements:", e);
    }
  }, [etablissementSimuleId, profil?.etablissement_id]);

  useEffect(() => {
    if (isSolo && !soloTabs.includes(activeTab)) {
      navigate('/tableau-de-bord', { replace: true });
    }
  }, [activeTab, isSolo, navigate]);

  const handleTabChange = (tabId: string) => {
    if (isSolo && !soloTabs.includes(tabId)) {
      setActiveTab('dashboard');
      navigate('/tableau-de-bord', { replace: true });
      return;
    }

    setActiveTab(tabId);
    navigate(`/tableau-de-bord?tab=${tabId}`, { replace: true });
  };

  if (chargement || !profil) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }

  const renderContent = () => {
    if (isSolo && !soloTabs.includes(activeTab)) return <DashboardAccueil isSolo={isSolo} />;

    switch (activeTab) {
      case 'dashboard': return <DashboardAccueil isSolo={isSolo} />;
      case 'comptabilite': return <GrandLivre />;
      case 'securite-audit': return <ModuleSecuriteAdmin />;
      case 'caisse-express': return <CaisseExpress />;
      case 'stocks': return <GestionStocks />;
      case 'achats': return <GestionAchats />;
      case 'saisie-journaliere': return <SaisieJournaliere />;
      case 'finances': return <GestionFinance />;
      case 'crm': return <GestionCRM />;
      case 'equipe': return <GestionEmployes />;
      case 'planning': return <PlanningEquipe />;
      case 'hybride': return <ModeHybride />;
      case 'alertes': return <CentreAlertes />;
      case 'parametres': return <GestionEtablissement />;
      case 'conformite': return <GestionConformite />;
      case 'ia': return <IAIntelligence />;
      case 'debug': return <ModuleDebug />;
      default: return <DashboardAccueil isSolo={isSolo} />;
    }
  };

  return (
    <div className={`app-layout ${darkMode ? 'dark' : ''}`}>
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} isSolo={isSolo} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-surface-2 p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<SkeletonDashboard />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TableauClient;
