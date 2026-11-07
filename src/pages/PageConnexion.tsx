import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Shield, Mail, Lock, ArrowRight, 
  Zap, ChevronLeft, AlertCircle, Loader2,
  Sparkles, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PageConnexion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { connexion } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await connexion(email, password);
      const profil = useAuthStore.getState().profil;
      toast.success("Bon retour dans votre espace !");
      navigate(profil?.role === 'super_admin' ? '/super-admin' : '/tableau-de-bord');
    } catch (error: any) {
      toast.error(error.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-100">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-orange-100 rounded-full blur-[120px] opacity-40" />
      </div>

      <div className="max-w-6xl w-full bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 border border-white">
        
        {/* Left Side: Branding & Welcome */}
        <div className="md:w-[45%] bg-[#1E3A8A] p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="space-y-10 relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <ChevronLeft size={16} /> Retour au portail
            </Link>
            <div className="flex items-center gap-4 pt-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                 <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase">GestCave Pro</h1>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="w-16 h-1 bg-[#FF7A00] rounded-full" />
            <h2 className="text-5xl font-black leading-[1.1] tracking-tight uppercase">
                Maîtrisez <br/> 
                <span className="text-[#FF7A00]">votre empire.</span>
            </h2>
            <p className="text-blue-100/60 leading-relaxed font-medium text-lg max-w-sm">
              Connectez-vous pour piloter votre établissement avec la précision chirurgicale de nos outils d'IA.
            </p>
          </div>

          <div className="pt-12 border-t border-white/10 flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-300">
                <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-100/40 uppercase tracking-[0.3em]">Infrastructure Sécurisée TLS 1.3</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-[55%] p-16 md:p-24 bg-white">
          <div className="max-w-md mx-auto space-y-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[#1E3A8A] text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                 <Sparkles size={12} className="text-[#FF7A00]" /> Authentification
              </div>
              <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase">Espace Client</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Entrez vos identifiants administrateur</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adresse Professionnelle</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <Mail size={22} />
                  </div>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="directeur@etablissement.com"
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mot de passe</label>
                  <button type="button" className="text-[10px] font-black text-[#FF7A00] uppercase tracking-widest hover:opacity-70 transition-opacity">Perdu ?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                    <Lock size={22} />
                  </div>
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm placeholder:text-slate-200" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 group disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    Accéder au Tableau de Bord
                    <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform text-[#FF7A00]" />
                  </>
                )}
              </button>
            </form>

            {/* Accès Démo Version 2.0 en 1 clic */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-orange-500" />
                  Mode Version 2.0 — Accès Direct
                </span>
                <span className="text-[9px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                  1 Clic
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    const { activerModeDemo } = useAuthStore.getState();
                    activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                    navigate('/tableau-de-bord');
                    toast.success("Connecté en Gérant (V2.0)");
                  }}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-xl flex items-center gap-2 transition-all border border-blue-100 text-left cursor-pointer"
                >
                  <span className="text-base">🏢</span>
                  <div>
                    <div className="leading-tight">Gérant / Direction</div>
                    <div className="text-[9px] text-slate-500 font-normal">Tableau de bord complet</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { activerModeDemo } = useAuthStore.getState();
                    activerModeDemo('super_admin', 'Super Administrateur SaaS', 'super_admin');
                    navigate('/super-admin');
                    toast.success("Connecté en Super Admin (V2.0)");
                  }}
                  className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl flex items-center gap-2 transition-all border border-purple-100 text-left cursor-pointer"
                >
                  <span className="text-base">👑</span>
                  <div>
                    <div className="leading-tight">Super Admin</div>
                    <div className="text-[9px] text-slate-500 font-normal">Multi-sites & Licences</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { activerModeDemo } = useAuthStore.getState();
                    activerModeDemo('employe', 'Jean-Baptiste (Serveur)', 'serveur');
                    navigate('/serveur');
                    toast.success("Session Serveur active");
                  }}
                  className="p-3 bg-orange-50 hover:bg-orange-100 text-orange-900 rounded-xl flex items-center gap-2 transition-all border border-orange-100 text-left cursor-pointer"
                >
                  <span className="text-base">🍽️</span>
                  <div>
                    <div className="leading-tight">Serveur POS</div>
                    <div className="text-[9px] text-slate-500 font-normal">Prise de commandes</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { activerModeDemo } = useAuthStore.getState();
                    activerModeDemo('employe', 'Céleste (Cuisine & Bar)', 'cuisine');
                    navigate('/cuisine');
                    toast.success("Session Cuisine KDS active");
                  }}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl flex items-center gap-2 transition-all border border-emerald-100 text-left cursor-pointer"
                >
                  <span className="text-base">👨‍🍳</span>
                  <div>
                    <div className="leading-tight">KDS Cuisine</div>
                    <div className="text-[9px] text-slate-500 font-normal">Écran de production</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4 text-center border-t border-slate-50">
              <p className="text-slate-400 text-sm font-bold">
                Pas encore de compte ? {' '}
                <Link to="/inscription" className="text-[#1E3A8A] hover:text-[#FF7A00] transition-colors border-b-2 border-blue-50 hover:border-orange-100 pb-0.5">
                  Créer un établissement
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageConnexion;
