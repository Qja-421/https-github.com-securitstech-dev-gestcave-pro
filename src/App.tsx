import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PageAccueil from './pages/PageAccueil';
import PageConnexion from './pages/PageConnexion';
import TableauSuperAdmin from './pages/TableauSuperAdmin';
import TableauClient from './pages/TableauClient';
import PageAbonnement from './pages/PageAbonnement';
import SelectionMode from './pages/roles/SelectionMode';
import InterfaceServeur from './pages/roles/InterfaceServeur';
import InterfaceCuisine from './pages/roles/InterfaceCuisine';
import InterfaceCaissier from './pages/roles/InterfaceCaissier';
import PageConsoleTerminaux from './pages/PageConsoleTerminaux';
import PageInscription from './pages/PageInscription';
import PageActivation from './pages/PageActivation';
import PagePoste from './pages/PagePoste';
import PageDemoScenario from './pages/PageDemoScenario';
import PagePointage from './pages/PagePointage';
import PageTerminalManager from './pages/PageTerminalManager';
import RoleGuard from './components/auth/RoleGuard';
import ConnectivityIndicator from './components/ui/ConnectivityIndicator';
import { BarreVersion2 } from './components/ui/BarreVersion2';

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-16">
        <ConnectivityIndicator />
        <BarreVersion2 />
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<PageAccueil />} />
          <Route path="/demo-scenario" element={<PageDemoScenario />} />
          <Route path="/pointage/:etablissementId" element={<PagePointage />} />
          <Route path="/manager/:etablissementId" element={<PageTerminalManager />} />
          <Route path="/connexion" element={<PageConnexion />} />
          <Route path="/activation" element={<PageActivation />} />
          
          {/* Sélection de rôle après connexion */}
          <Route path="/choisir-role" element={<SelectionMode />} />

          {/* Interfaces spécialisées par rôle */}
          <Route path="/serveur" element={<RoleGuard allowedRoles={['client_admin', 'employe']}><InterfaceServeur /></RoleGuard>} />
          <Route path="/cuisine" element={<RoleGuard allowedRoles={['client_admin', 'employe']}><InterfaceCuisine /></RoleGuard>} />
          <Route path="/caisse" element={<RoleGuard allowedRoles={['client_admin', 'employe']}><InterfaceCaissier /></RoleGuard>} />
          <Route path="/terminaux" element={<RoleGuard allowedRoles={['client_admin']}><PageConsoleTerminaux /></RoleGuard>} />

          {/* Routes Admin */}
          <Route path="/super-admin/*" element={<RoleGuard allowedRoles={['super_admin']}><TableauSuperAdmin /></RoleGuard>} />
          <Route path="/tableau-de-bord/*" element={<RoleGuard allowedRoles={['client_admin']}><TableauClient /></RoleGuard>} />
          <Route path="/abonnement" element={<RoleGuard allowedRoles={['client_admin']}><PageAbonnement /></RoleGuard>} />
          <Route path="/inscription" element={<PageInscription />} />
          {/* Route poste : accès direct des appareils du personnel via lien unique */}
          <Route path="/poste/:etablissementId" element={<PagePoste />} />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
