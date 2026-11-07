import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Building, Mail, Lock, User, 
  ArrowRight, Sparkles, ChevronLeft, 
  Loader2, Globe, ShieldCheck, Zap, CheckCircle2, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: '9.999',
    tag: 'Mini-Bar / Cave',
    color: 'emerald',
    features: ['1 Utilisateur', 'Caisse Express', 'Suivi Stocks & Alertes', 'Mode Papier (PDF)', 'Hors-Ligne']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '30.000',
    tag: 'Bar & Restaurant',
    color: 'blue',
    features: ['1 Établissement', 'Gestion Stocks', '100 Commandes/jour', 'Mode Hybride (PDF)', 'Support Email']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '55.000',
    tag: 'Le Plus Populaire',
    color: 'orange',
    features: ['3 Établissements', 'Stocks avancés', 'Commandes illimitées', 'Rapports PDF', 'Support 24/7']
  },
  {
    id: 'business',
    name: 'Business',
    price: '95.000',
    tag: 'Groupe / Chaîne',
    color: 'violet',
    features: ['Établissements illimités', 'Multi-niveaux', 'RH & Salaires auto', 'Audit complet', 'Support Prioritaire']
  }
];

const colorMap: any = {
  emerald: {
    border: 'border-emerald-300',
    selected: 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100',
    tag: 'bg-emerald-500',
    price: 'text-emerald-600',
    check: 'text-emerald-500',
    btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
  },
  blue: {
    border: 'border-slate-200',
    selected: 'border-[#1E3A8A] bg-blue-50 shadow-lg shadow-blue-100',
    tag: 'bg-blue-400',
    price: 'text-[#1E3A8A]',
    check: 'text-blue-500',
    btn: 'bg-[#1E3A8A] hover:bg-blue-800 shadow-blue-200',
  },
  orange: {
    border: 'border-orange-200',
    selected: 'border-[#FF7A00] bg-orange-50 shadow-lg shadow-orange-100',
    tag: 'bg-[#FF7A00]',
    price: 'text-[#FF7A00]',
    check: 'text-orange-500',
    btn: 'bg-[#FF7A00] hover:bg-orange-600 shadow-orange-200',
  },
  violet: {
    border: 'border-violet-200',
    selected: 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-100',
    tag: 'bg-violet-500',
    price: 'text-violet-600',
    check: 'text-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-200',
  }
};

const PageInscription = () => {
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    etablissementNom: ''
  });
  const [loading, setLoading] = useState(false);
  const { inscription } = useAuthStore();
  const navigate = useNavigate();

  const activePlan = PLANS.find(p => p.id === selectedPlan)!;
  const colors = colorMap[activePlan.color];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inscription(formData.email, formData.motDePasse, formData.nom, formData.etablissementNom);
      toast.success(`Bienvenue dans l'écosystème GestCave ! Essai ${activePlan.name} démarré (14 jours gratuits).`);
      navigate('/tableau-de-bord');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-orange-100 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="max-w-5xl w-full relative z-10">

        {/* Step 1 : Choix de formule */}
        {step === 'plan' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#1E3A8A] transition-colors text-xs font-bold uppercase tracking-widest mb-4">
                <ChevronLeft size={14} /> Retour à l'accueil
              </Link>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[#FF7A00] text-[10px] font-black uppercase tracking-widest border border-orange-100 mb-2">
                <Sparkles size={12} /> Essai Gratuit 14 Jours — Sans carte bancaire
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#1E3A8A] tracking-tight">
                Choisissez votre formule
              </h1>
              <p className="text-slate-500 font-medium">
                Vous accédez à <strong>toutes les fonctionnalités</strong> pendant 14 jours, quelle que soit la formule choisie.
              </p>
            </div>

            {/* Grille des plans */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map(plan => {
                const c = colorMap[plan.color];
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-6 rounded-[2rem] border-2 text-left transition-all relative flex flex-col gap-4 hover:-translate-y-1 ${isSelected ? c.selected : `bg-white ${c.border}`}`}
                  >
                    {/* Tag */}
                    <div className={`absolute -top-3 left-4 ${c.tag} text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full`}>
                      {plan.tag}
                    </div>

                    {/* Indicateur sélection */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-current rounded-full flex items-center justify-center">
                        <CheckCircle2 size={18} className={`${c.price} bg-white rounded-full`} />
                      </div>
                    )}

                    <div className="mt-3">
                      <h3 className={`font-black text-xl ${isSelected ? c.price : 'text-[#1E3A8A]'}`}>{plan.name}</h3>
                      <div className="mt-1">
                        <span className={`text-2xl font-black ${c.price}`}>{plan.price}</span>
                        <span className="text-slate-400 text-xs font-bold ml-1">XAF/mois</span>
                      </div>
                    </div>

                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                          <CheckCircle2 size={13} className={`${c.check} flex-shrink-0 mt-0.5`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Bouton continuer */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setStep('form')}
                className={`px-12 py-5 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-3 hover:-translate-y-1 transition-all ${colors.btn}`}
              >
                Continuer avec la formule {activePlan.name}
                <ChevronRight size={20} />
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 font-medium">
              Vous pouvez changer de formule à tout moment depuis votre espace. Aucun engagement.
            </p>
          </div>
        )}

        {/* Step 2 : Formulaire */}
        {step === 'form' && (
          <div className="max-w-6xl w-full bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)] flex flex-col md:flex-row overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Panneau gauche */}
            <div className="md:w-[40%] bg-[#1E3A8A] p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <div className="space-y-8 relative z-10">
                <button 
                  onClick={() => setStep('plan')}
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5"
                >
                  <ChevronLeft size={16} /> Changer de formule
                </button>
                <div className="flex items-center gap-4">
                  <img src="/logo_gestcave.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <h1 className="text-xl font-black tracking-tight uppercase">GestCave Pro</h1>
                </div>
              </div>

              {/* Récapitulatif de la formule choisie */}
              <div className="relative z-10 space-y-6">
                <div className="bg-white/10 rounded-3xl p-6 border border-white/10">
                  <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">Formule choisie</p>
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-white">{activePlan.name}</h2>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#FF7A00]">{activePlan.price}</p>
                      <p className="text-blue-200 text-xs">XAF / mois</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-emerald-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} /> 14 jours gratuits inclus
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: <Zap size={16} />, text: 'Déploiement en 60 secondes' },
                    { icon: <ShieldCheck size={16} />, text: 'Données sécurisées & chiffrées' },
                    { icon: <Globe size={16} />, text: 'Accès Cloud Multi-Postes' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[#FF7A00] border border-white/5">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-100/80">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 text-[10px] font-black text-blue-100/40 uppercase tracking-[0.3em] relative z-10">
                Sovereign Ledger Technology — 2026
              </div>
            </div>

            {/* Formulaire droit */}
            <div className="md:w-[60%] p-12 md:p-20 bg-white overflow-y-auto max-h-[90vh]">
              <div className="max-w-md mx-auto space-y-10">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[#FF7A00] text-[10px] font-black uppercase tracking-widest border border-orange-100/50">
                    <Sparkles size={12} /> Nouveau Partenaire
                  </div>
                  <h3 className="text-3xl font-black text-[#1E3A8A] tracking-tighter uppercase">Créer mon accès</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configurez votre environnement en 30 secondes</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  {[
                    { label: "Nom de l'Établissement", field: 'etablissementNom', type: 'text', placeholder: 'Cave Suprême, Lounge Bar...', icon: <Building size={20} /> },
                    { label: "Votre Nom Complet", field: 'nom', type: 'text', placeholder: 'Jacques Mbemba', icon: <User size={20} /> },
                    { label: "Email Professionnel", field: 'email', type: 'email', placeholder: 'contact@monsuperbar.com', icon: <Mail size={20} /> },
                    { label: "Mot de Passe", field: 'motDePasse', type: 'password', placeholder: 'Minimum 8 caractères', icon: <Lock size={20} /> },
                  ].map(({ label, field, type, placeholder, icon }) => (
                    <div key={field} className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                          {icon}
                        </div>
                        <input
                          required
                          type={type}
                          value={(formData as any)[field]}
                          onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-5 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] placeholder:text-slate-200 text-sm"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-900/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {loading ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : (
                      <>
                        Démarrer l'essai gratuit
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-6 text-center border-t border-slate-50">
                  <p className="text-slate-400 text-sm font-bold">
                    Déjà partenaire ?{' '}
                    <Link to="/connexion" className="text-[#1E3A8A] hover:text-[#FF7A00] transition-colors border-b-2 border-blue-50 hover:border-orange-100 pb-0.5">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageInscription;
