import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ChevronRight, ArrowRight, ShieldCheck, Zap, 
  Smartphone, BarChart3, Clock, LayoutDashboard,
  Mail, Phone, MapPin, Menu, X, Globe, Star,
  Server, Cpu, Lock, Send, Flame, Sparkles, Wine,
  Building2, Check, ArrowUpRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, Timestamp, onSnapshot, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const PageAccueil = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Sélecteur d'édition : 'solobar' (petits) ou 'gestcave' (grands)
  const [editionActive, setEditionActive] = useState<'solobar' | 'gestcave'>('gestcave');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  // Modales
  const [modalPaiement, setModalPaiement] = useState<{ ouvert: boolean, plan: string, prix: string } | null>(null);
  const [etapePaiement, setEtapePaiement] = useState<'choix' | 'mobile' | 'direction'>('choix');
  const [operateur, setOperateur] = useState<'airtel' | 'mtn' | null>(null);
  const [justificatif, setJustificatif] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [emailPaiement, setEmailPaiement] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Formulaire de contact
  const [contactForm, setContactForm] = useState({ nom: '', contact: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);

  const [activeSpots, setActiveSpots] = useState(3);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'stats_public', 'plateforme'),
        (snap) => {
          setActiveSpots(Number(snap.data()?.etablissements_actifs) || 3);
        },
        () => setActiveSpots(3)
      );
      return () => unsub();
    } catch (e) {
      setActiveSpots(3);
    }
  }, []);

  const spotsRestants = Math.max(0, 10 - activeSpots);

  const handlePaiementMobile = async () => {
    if (!emailPaiement.trim()) {
      toast.error("Veuillez renseigner votre email pour l'activation.");
      return;
    }
    if (!justificatif.trim() && !screenshotFile) {
      toast.error("Veuillez fournir une justification ou une capture d'écran.");
      return;
    }

    setUploadProgress(true);
    try {
      let screenshotUrl = '';
      if (screenshotFile) {
        const fileRef = ref(storage, `paiements/${Date.now()}_${screenshotFile.name}`);
        const snapshot = await uploadBytes(fileRef, screenshotFile);
        screenshotUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'paiements'), {
        plan: modalPaiement?.plan,
        montant: modalPaiement?.prix,
        email: emailPaiement,
        operateur: operateur,
        justification: justificatif,
        screenshot: screenshotUrl,
        date: Timestamp.now(),
        statut: 'en_attente',
        source: 'landing_page'
      });

      toast.success("Paiement enregistré ! Votre accès sera activé.");
      setModalPaiement(null);
      setEtapePaiement('choix');
      setJustificatif('');
      setEmailPaiement('');
      setScreenshotFile(null);
    } catch (error) {
      console.error("Erreur paiement:", error);
      toast.error("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await addDoc(collection(db, 'messages_contact'), {
        ...contactForm,
        date: Timestamp.now(),
        statut: 'nouveau'
      });
      toast.success("Message envoyé ! Nous vous contacterons rapidement.");
      setContactForm({ nom: '', contact: '', message: '' });
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi du message.");
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Inter',sans-serif] overflow-x-hidden bg-ambient-mesh">
      
      {/* ─── BANNIÈRE DUALE D'ANNONCE ─── */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-slate-950 py-2.5 px-4 text-center font-bold text-xs sticky top-0 z-[120] shadow-lg flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[11px]">
          <Flame className="w-4 h-4 fill-slate-950" />
          <span>Nouvelle Édition SoloBar POS en ligne !</span>
        </div>
        <span className="hidden md:inline text-slate-900/60">•</span>
        <span className="hidden md:inline font-medium">Buvettes, maquis & caves à gérant unique</span>
        <a 
          href="https://solobar-pos.vercel.app" 
          target="_blank" 
          rel="noreferrer" 
          className="ml-2 inline-flex items-center gap-1 bg-slate-950 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black hover:bg-slate-900 transition-transform active:scale-95"
        >
          <span>Tester SoloBar Direct</span>
          <ArrowUpRight className="w-3 h-3 stroke-[3]" />
        </a>
      </div>

      {/* ─── NAVIGATION GLASSMORPHIC ─── */}
      <nav className={`fixed top-10 left-0 w-full z-[110] transition-all duration-300 ${
        scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 text-white">
              <Wine className="w-5 h-5 drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white leading-none">GestCave</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Suite 2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">GestCave Pro & SoloBar POS</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <a href="#editions" className="text-xs font-bold text-slate-300 hover:text-amber-400 transition">Les 2 Éditions</a>
            <a href="#fonctionnalites" className="text-xs font-bold text-slate-300 hover:text-amber-400 transition">Fonctionnalités</a>
            <a href="#abonnements" className="text-xs font-bold text-slate-300 hover:text-amber-400 transition">Tarifs</a>
            <a href="#contact" className="text-xs font-bold text-slate-300 hover:text-amber-400 transition">Contact</a>
            
            <div className="h-4 w-px bg-white/10" />

            {/* Accès SoloBar POS */}
            <a
              href="https://solobar-pos.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>SoloBar POS (Buvette)</span>
            </a>

            <Link 
              to="/connexion" 
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 transition"
            >
              Connexion Pro
            </Link>

            <button 
              onClick={() => {
                const { activerModeDemo } = useAuthStore.getState();
                activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                navigate('/tableau-de-bord');
                toast.success("Bienvenue dans la Démo GestCave Pro V2.0 !");
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles size={14} className="stroke-[2.5]" />
              <span>Démo V2.0</span>
            </button>
          </div>

          <button className="lg:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
            <a href="#editions" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-200">Les 2 Éditions</a>
            <a href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-200">Fonctionnalités</a>
            <a href="#abonnements" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-200">Tarifs</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-200">Contact</a>
            <hr className="border-white/10" />
            <a
              href="https://solobar-pos.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Lancer SoloBar POS (Buvette & Barman Unique)</span>
            </a>
            <Link to="/connexion" className="py-2.5 text-center text-xs font-bold text-slate-300 bg-slate-900 rounded-xl border border-white/10">
              Se Connecter à GestCave Pro
            </Link>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION PRINCIPALE ─── */}
      <section className="relative pt-44 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          {/* Badge Supérieur */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 border border-white/10 rounded-full text-amber-400 text-xs font-extrabold tracking-wide uppercase mb-6 shadow-md backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>Suite Complète de Gestion Débits de Boissons & Restauration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            La solution idéale, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
              que vous soyez 1 barman ou 50 employés.
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
            Pour la buvette de quartier jusqu’au grand complexe lounge-restaurant. Choisissez la formule calibrée pour votre établissement et gardez le contrôle total sur vos encaissements et vos stocks.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <a 
              href="https://solobar-pos.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 stroke-[3]" />
              <span>TESTER SOLOBAR POS (BUVETTES)</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </a>

            <button 
              onClick={() => {
                const { activerModeDemo } = useAuthStore.getState();
                activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                navigate('/tableau-de-bord');
                toast.success("Bienvenue dans la Démo GestCave Pro !");
              }}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-850 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>DÉMO GESTCAVE PRO (COMPLEXES)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION LES DEUX ÉDITIONS CÔTE À CÔTE ─── */}
      <section id="editions" className="py-20 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Architecture Adaptative
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Deux Éditions, Une Même Excellence
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Le même design sombre et moderne, adapté à la dimension réelle de votre commerce.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte Édition SoloBar POS */}
            <div className="glass-card rounded-3xl p-8 border border-amber-500/30 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-bl-2xl">
                Micro & Petits Bars
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                  <Wine className="w-6 h-6" />
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-2xl font-black text-white">SoloBar POS</h3>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Édition Express</span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  Conçu spécialement pour les <strong>buvettes, maquis, caves de quartier et bars avec un seul opérateur</strong> qui fait à la fois le rôle de barman et de caissier.
                </p>

                <ul className="space-y-3 text-xs mb-8">
                  {[
                    'Opérateur Unique : Barman + Caisse sur un seul écran tactile',
                    '100% Hors-Ligne (Local-First) : Zéro panne, zéro coupure internet',
                    'Encaissement express en 2 clics avec calcul de monnaie instantané',
                    'Gestion rapide des casiers (+12, +24) et alertes stock',
                    'Clôture Z en 30 secondes avec écart de caisse calculé',
                    'Impression immédiate de tickets thermiques assainis'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300">
                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5 stroke-[3]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">À partir de</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">5 000 F <span className="text-xs font-normal text-slate-400">/ mois</span></span>
                </div>

                <a
                  href="https://solobar-pos.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition"
                >
                  <span>Lancer SoloBar</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                </a>
              </div>
            </div>

            {/* Carte Édition GestCave Pro */}
            <div className="glass-card rounded-3xl p-8 border border-white/10 hover:border-sky-500/40 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-sky-500 to-blue-600 text-white font-black text-[10px] uppercase tracking-wider rounded-bl-2xl">
                Moyens & Grands Établissements
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-5">
                  <Building2 className="w-6 h-6" />
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-2xl font-black text-white">GestCave Pro</h3>
                  <span className="text-xs text-sky-400 font-bold uppercase tracking-wider">Édition Entreprise</span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  La suite complète pour les <strong>lounges, restaurants, discothèques et complexes multi-sites</strong> avec personnel hiérarchisé et flux complexes.
                </p>

                <ul className="space-y-3 text-xs mb-8">
                  {[
                    'Multi-Postes : Terminaux serveurs mobiles, écran cuisine KDS, caisse centrale',
                    'Gestion RH & Pointage biométrique / PIN du personnel',
                    'Stocks multi-dépôts avec alertes prédictives et gestion des pertes',
                    'Grand Livre comptable, gestion des dettes clients & salaires',
                    'Console Super Admin multi-établissements & supervision direction',
                    'Audit de sécurité et traçabilité inviolable des transactions'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-300">
                      <Check className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5 stroke-[3]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">À partir de</span>
                  <span className="text-2xl font-black text-sky-400 font-mono">30 000 F <span className="text-xs font-normal text-slate-400">/ mois</span></span>
                </div>

                <button
                  onClick={() => {
                    const { activerModeDemo } = useAuthStore.getState();
                    activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                    navigate('/tableau-de-bord');
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition"
                >
                  <span>Explorer la V2.0</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION TARIFS & ABONNEMENTS DUALS ─── */}
      <section id="abonnements" className="py-24 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">Grille Tarifaire Transparente</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Choisissez la formule de votre bar</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Basculez entre l'édition légère SoloBar ou l'édition complète GestCave Pro.
            </p>
          </div>

          {/* Toggle entre SoloBar et GestCave */}
          <div className="flex justify-center mb-12">
            <div className="bg-slate-900/90 border border-white/10 p-1.5 rounded-2xl inline-flex gap-2 backdrop-blur-md">
              <button
                onClick={() => setEditionActive('solobar')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                  editionActive === 'solobar'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wine className="w-4 h-4" />
                <span>SoloBar POS (Petits & Buvettes)</span>
              </button>

              <button
                onClick={() => setEditionActive('gestcave')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                  editionActive === 'gestcave'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>GestCave Pro (Grands Établissements)</span>
              </button>
            </div>
          </div>

          {/* Forfaits SoloBar POS */}
          {editionActive === 'solobar' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
              {[
                {
                  id: 'gratuit',
                  name: 'Essai Gratuit',
                  price: '0 F',
                  duration: '30 JOURS',
                  desc: 'Test complet sans engagement sur 1 appareil.',
                  features: ['1 Poste Caisse tactile', 'Catalogue produits & stocks', 'Calcul instantané monnaie', 'Rapports de caisse Z', 'Stockage local 100% hors-ligne'],
                  cta: 'Lancer Gratuitement',
                  link: 'https://solobar-pos.vercel.app'
                },
                {
                  id: 'solo',
                  name: 'Solo Barman',
                  price: '5 000 F',
                  duration: 'MOIS',
                  popular: true,
                  desc: 'Idéal pour buvette ou maquis autonome.',
                  features: ['Toutes les fonctions gratuites', 'Tickets de caisse personnalisés', 'Restauration et sauvegarde locale', 'Gestion des casiers (+12, +24)', 'Support WhatsApp prioritaire'],
                  cta: 'Souscrire Solo',
                  link: 'https://solobar-pos.vercel.app'
                },
                {
                  id: 'pro',
                  name: 'SoloBar Pro',
                  price: '12 000 F',
                  duration: 'MOIS',
                  desc: 'Pour bars avec plusieurs postes de vente.',
                  features: ['Jusqu\'à 3 appareils connectés', 'Synchronisation cloud automatique', 'Historique des ventes illimité', 'Statistiques financières détaillées', 'Support VIP 7j/7'],
                  cta: 'Souscrire Pro',
                  link: 'https://solobar-pos.vercel.app'
                },
                {
                  id: 'business',
                  name: 'Chaîne SoloBar',
                  price: '25 000 F',
                  duration: 'MOIS',
                  desc: 'Multi-points de vente pour propriétaires.',
                  features: ['Établissements multiples', 'Tableau de bord propriétaire central', 'Consolidation des recettes', 'Rapports comparatifs', 'Gestionnaire de compte dédié'],
                  cta: 'Souscrire Business',
                  link: 'https://solobar-pos.vercel.app'
                }
              ].map((p) => (
                <div key={p.id} className={`glass-card rounded-3xl p-6 flex flex-col justify-between border ${
                  p.popular ? 'border-amber-400/80 ring-2 ring-amber-400/30' : 'border-white/10'
                }`}>
                  <div>
                    {p.popular && (
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 mb-3 inline-block">
                        Plus Populaire
                      </span>
                    )}
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.desc}</p>

                    <div className="my-5">
                      <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{p.price}</span>
                      <span className="text-xs text-slate-400 ml-1">/ {p.duration}</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 border-t border-white/5 pt-4">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-amber-500/20"
                    >
                      <span>{p.cta}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Forfaits GestCave Pro */}
          {editionActive === 'gestcave' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
              {[
                {
                  id: 'Solo',
                  name: 'Solo Pro',
                  price: '9 999 F',
                  duration: 'MOIS',
                  desc: 'Pour gérant voulant initier la digitalisation.',
                  features: ['1 Utilisateur Patron', 'Caisse Express 1-clic', 'Suivi des stocks & alertes', 'Mode papier (PDF)', 'Fonctionne Hors-Ligne'],
                },
                {
                  id: 'Starter',
                  name: 'Starter',
                  price: '30 000 F',
                  duration: 'MOIS',
                  desc: 'Pour bars et caves en structuration.',
                  features: ['1 Établissement complet', 'Gestion des stocks de base', '100 commandes / jour', 'Mode hybride papier/écran', 'Support standard par email'],
                },
                {
                  id: 'Premium',
                  name: 'Performance',
                  price: '55 000 F',
                  duration: 'MOIS',
                  popular: true,
                  desc: 'Pour complexes et restaurants dynamiques.',
                  features: ['3 Établissements / Postes', 'Stocks avancés + Ingrédients cuisine', 'Commandes illimitées', 'Rapports PDF & exports financiers', 'Support VIP 24h/24'],
                },
                {
                  id: 'Business',
                  name: 'Empire',
                  price: '95 000 F',
                  duration: 'MOIS',
                  desc: 'Pour chaînes, grands lounges et discothèques.',
                  features: ['Établissements illimités', 'Gestion RH & salaires automatiques', 'Audit de sécurité complet', 'Manager dédié 24/7', 'Intégration sur-mesure'],
                }
              ].map((p) => (
                <div key={p.id} className={`glass-card rounded-3xl p-6 flex flex-col justify-between border ${
                  p.popular ? 'border-sky-400/80 ring-2 ring-sky-400/30' : 'border-white/10'
                }`}>
                  <div>
                    {p.popular && (
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-500 text-white mb-3 inline-block">
                        Recommandé Complexes
                      </span>
                    )}
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.desc}</p>

                    <div className="my-5">
                      <span className="text-3xl font-black text-sky-400 font-mono tracking-tight">{p.price}</span>
                      <span className="text-xs text-slate-400 ml-1">/ {p.duration}</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 border-t border-white/5 pt-4">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5">
                    <button
                      onClick={() => setModalPaiement({ ouvert: true, plan: p.id, prix: p.price })}
                      className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-sky-500/20"
                    >
                      <span>Activer GestCave {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── MODAL DE PAIEMENT MOBILE (AIRTEL / MTN) ─── */}
      {modalPaiement?.ouvert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setModalPaiement(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Souscription Sécurisée</span>
              <h3 className="text-xl font-black text-white mt-0.5">Activation Formule {modalPaiement.plan}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">Montant : {modalPaiement.prix} XAF</p>
            </div>

            {etapePaiement === 'choix' && (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">
                  Sélectionnez votre moyen de paiement Mobile Money :
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setEtapePaiement('mobile'); setOperateur('airtel'); }}
                    className="p-5 rounded-2xl bg-slate-950 border border-white/10 hover:border-rose-500/50 flex flex-col items-center gap-2 transition"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow">
                      <img src="/logo_airtel.png" alt="Airtel" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-black text-xs text-white">Airtel Money</span>
                  </button>

                  <button
                    onClick={() => { setEtapePaiement('mobile'); setOperateur('mtn'); }}
                    className="p-5 rounded-2xl bg-slate-950 border border-white/10 hover:border-amber-500/50 flex flex-col items-center gap-2 transition"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow">
                      <img src="/logo_mtn.png" alt="MTN" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-black text-xs text-white">MTN MoMo</span>
                  </button>
                </div>
              </div>
            )}

            {etapePaiement === 'mobile' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-white/10">
                  <p className="font-bold text-white mb-1">
                    Numéro de dépôt {operateur === 'airtel' ? 'Airtel Money' : 'MTN Mobile Money'} :
                  </p>
                  <p className="text-lg font-mono font-black text-amber-400">
                    {operateur === 'airtel' ? '+242 05 555 55 55' : '+242 06 666 66 66'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Bénéficiaire : SECURITS TECH CONGO</p>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Votre adresse email de connexion *</label>
                  <input
                    type="email"
                    required
                    value={emailPaiement}
                    onChange={(e) => setEmailPaiement(e.target.value)}
                    placeholder="gerant@votredomaine.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">ID de transaction ou Numéro expéditeur *</label>
                  <input
                    type="text"
                    required
                    value={justificatif}
                    onChange={(e) => setJustificatif(e.target.value)}
                    placeholder="Ex: TXN-9847294 ou 06 000 00 00"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEtapePaiement('choix')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handlePaiementMobile}
                    disabled={uploadProgress}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition"
                  >
                    {uploadProgress ? 'Validation en cours...' : 'CONFIRMER LE PAIEMENT'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION CONTACT & SUPPORT ─── */}
      <section id="contact" className="py-20 border-t border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card rounded-3xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Support Technique</span>
              <h2 className="text-2xl font-black text-white mt-1">Une question ? Besoin d'une installation physique ?</h2>
              <p className="text-xs text-slate-400 mt-1">Nos équipes à Brazzaville et Pointe-Noire sont à votre disposition.</p>
            </div>

            <form onSubmit={handleSubmitContact} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Votre Nom *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.nom}
                    onChange={(e) => setContactForm({ ...contactForm, nom: e.target.value })}
                    placeholder="Jean Dupont"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Téléphone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.contact}
                    onChange={(e) => setContactForm({ ...contactForm, contact: e.target.value })}
                    placeholder="+242 06 000 00 00"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Votre Message *</label>
                <textarea
                  required
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Décrivez votre besoin (devis, formation du personnel, matériel caisse)..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{contactLoading ? 'Envoi en cours...' : 'ENVOYER MA DEMANDE'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── FOOTER HARMONISÉ ─── */}
      <footer className="py-10 border-t border-white/10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">GestCave Suite • GestCave Pro & SoloBar POS</span>
          </div>
          <p>© 2026 Securits Tech. Tous droits réservés. République du Congo.</p>
        </div>
      </footer>
    </div>
  );
};

export default PageAccueil;
