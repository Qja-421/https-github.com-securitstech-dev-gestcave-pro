import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, Smartphone, Utensils, Receipt, 
  Clock, Shield, Copy, ExternalLink, ArrowLeft,
  Zap, Laptop, Tablet
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const PageConsoleTerminaux = () => {
  const navigate = useNavigate();
  const { profil } = useAuthStore();
  const etablissementId = profil?.etablissement_id || localStorage.getItem('gestcave_sim_etab_id');

  const baseUrl = window.location.origin;

  const terminaux = [
    {
      id: 'caisse',
      titre: 'Point de Vente (Caisse)',
      desc: 'Interface principale pour le Barman ou le Caissier. Gestion des paiements.',
      url: `${baseUrl}/poste/${etablissementId}?role=caisse`,
      icon: <Receipt size={32} />,
      color: 'bg-blue-600',
      type: 'Fixe / Tablette'
    },
    {
      id: 'serveur',
      titre: 'Prise de Commande',
      desc: 'Interface mobile pour les serveurs en salle. Envoi direct en cuisine.',
      url: `${baseUrl}/poste/${etablissementId}?role=serveur`,
      icon: <Smartphone size={32} />,
      color: 'bg-[#FF7A00]',
      type: 'Mobile'
    },
    {
      id: 'cuisine',
      titre: 'Écran Cuisine',
      desc: 'Affichage des commandes en attente. Validation des plats prêts.',
      url: `${baseUrl}/poste/${etablissementId}?role=cuisine`,
      icon: <Utensils size={32} />,
      color: 'bg-emerald-600',
      type: 'Écran Fixe'
    },
    {
      id: 'pointage',
      titre: 'Terminal de Pointage',
      desc: 'Pointage des arrivées, pauses et départs via code PIN unique.',
      url: `${baseUrl}/pointage/${etablissementId}`,
      icon: <Clock size={32} />,
      color: 'bg-indigo-600',
      type: 'Tablette Entrée'
    },
    {
      id: 'manager',
      titre: 'Console Gérant',
      desc: 'Supervision live du CA, des dépenses et de la présence équipe.',
      url: `${baseUrl}/manager/${etablissementId}`,
      icon: <Shield size={32} />,
      color: 'bg-slate-900',
      type: 'Poste Direction'
    }
  ];

  const copierLien = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Lien copié ! Envoyez-le à l'employé.");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-800 p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
             <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#1E3A8A] font-bold text-xs uppercase tracking-widest transition-colors">
                <ArrowLeft size={16} /> Retour Dashboard
             </button>
             <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none">
                Console de <span className="text-[#FF7A00]">Déploiement</span>
             </h1>
             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                Distribuez les accès aux différents postes de travail
             </p>
          </div>
          
          <div className="flex items-center gap-5 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Superviseur</p>
                <p className="text-lg font-black text-[#1E3A8A] tracking-tighter leading-none">
                  Bienvenue, <span className="text-[#FF7A00]">{profil?.prenom || 'Propriétaire'}</span> !
                </p>
             </div>
             <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-lg relative border-2 border-white">
                <span className="font-black text-xl">{profil?.prenom?.[0] || 'A'}</span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
             </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-[#1E3A8A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] -mr-20 -mt-20" />
           <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center flex-shrink-0 border border-white/10">
                 <Laptop size={40} className="text-[#FF7A00]" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black uppercase tracking-tight">Comment déployer les accès ?</h2>
                 <p className="text-blue-100/70 font-medium text-lg leading-relaxed">
                    Copiez le lien du terminal souhaité et envoyez-le par WhatsApp ou Email sur l'appareil de votre employé. 
                    Il n'aura qu'à ouvrir le lien et entrer son **Code PIN** pour commencer à travailler.
                 </p>
              </div>
           </div>
        </div>

        {/* Terminals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {terminaux.map((t) => (
             <div key={t.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-blue-900/5 hover:border-blue-100 transition-all flex flex-col group">
                <div className={`w-16 h-16 ${t.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-900/10 group-hover:scale-110 transition-transform`}>
                   {t.icon}
                </div>
                
                <div className="flex-1 space-y-4 mb-10">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight leading-none">{t.titre}</h3>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t.type}</span>
                   </div>
                   <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      {t.desc}
                   </p>
                </div>

                <div className="flex gap-3">
                   <button 
                     onClick={() => copierLien(t.url)}
                     className="flex-1 h-14 bg-slate-50 text-[#1E3A8A] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2 border border-slate-100"
                   >
                     <Copy size={16} /> Copier le lien
                   </button>
                   <button 
                     onClick={() => window.open(t.url, '_blank')}
                     className="w-14 h-14 bg-white text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100 hover:text-[#FF7A00] hover:border-orange-100 transition-all"
                   >
                     <ExternalLink size={20} />
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Security Footer */}
        <div className="text-center pt-8">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <Shield size={14} className="text-emerald-500" /> Sécurité des terminaux active — Chiffrement AES-256
           </p>
        </div>

      </div>
    </div>
  );
};

export default PageConsoleTerminaux;
