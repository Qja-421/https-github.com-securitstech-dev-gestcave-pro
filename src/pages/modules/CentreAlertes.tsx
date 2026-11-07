import React from 'react';
import { AlertTriangle, ShieldAlert, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function CentreAlertes() {
  const alertes = [
    { id: 1, type: 'critical', titre: 'Stock Critique', message: 'Il ne reste que 2 bouteilles de Whisky Black Label. Rupture imminente.', date: 'Il y a 10 min', module: 'Stocks' },
    { id: 2, type: 'warning', titre: 'Dette Client Élevée', message: 'La dette de M. Atangana dépasse le plafond autorisé (150,000 XAF).', date: 'Il y a 2 heures', module: 'CRM' },
    { id: 3, type: 'info', titre: 'Clôture de Caisse', message: 'La caisse du soir a été clôturée avec succès. Écart: 0 XAF.', date: 'Hier à 23:45', module: 'Finances' },
    { id: 4, type: 'warning', titre: 'Session Suspecte', message: 'Annulation de 3 commandes consécutives par le serveur Jean Dupont.', date: 'Hier à 21:12', module: 'Sécurité' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ShieldAlert size={24} className="text-danger" />;
      case 'warning': return <AlertTriangle size={24} className="text-warning" />;
      case 'info': return <CheckCircle size={24} className="text-success" />;
      default: return <AlertCircle size={24} className="text-info" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-danger-light border-danger/20';
      case 'warning': return 'bg-warning-light border-warning/20';
      case 'info': return 'bg-success-light border-success/20';
      default: return 'bg-info-light border-info/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-primary tracking-tight">Centre des Alertes</h2>
          <p className="text-text-secondary mt-1">Surveillance globale de votre établissement.</p>
        </div>
        <button className="btn btn-ghost">
          Marquer tout comme lu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {alertes.map(alerte => (
            <div key={alerte.id} className={`p-6 rounded-2xl border ${getColor(alerte.type)} flex gap-6 items-start transition-all hover:scale-[1.01]`}>
              <div className="shrink-0 mt-1">
                {getIcon(alerte.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-text-primary text-lg">{alerte.titre}</h4>
                  <span className="badge bg-white shadow-sm">{alerte.module}</span>
                </div>
                <p className="text-text-secondary text-sm mb-4 leading-relaxed">{alerte.message}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-text-muted flex items-center gap-1">
                    <Clock size={12} /> {alerte.date}
                  </span>
                  <button className="text-xs font-bold text-brand hover:underline">
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">Statistiques d'Alertes</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><ShieldAlert size={16} className="text-danger"/> Critiques</span>
                <span className="font-bold text-danger">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><AlertTriangle size={16} className="text-warning"/> Avertissements</span>
                <span className="font-bold text-warning">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary flex items-center gap-2"><CheckCircle size={16} className="text-success"/> Informations</span>
                <span className="font-bold text-success">1</span>
              </div>
            </div>
          </div>
          
          <div className="card p-6 bg-brand-primary-light border-none">
            <h3 className="font-bold text-brand text-lg mb-2">Paramétrage</h3>
            <p className="text-sm text-brand/70 mb-4">Configurez vos seuils d'alerte pour les stocks et les dettes.</p>
            <button className="btn btn-primary w-full">
              Régler les seuils
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
