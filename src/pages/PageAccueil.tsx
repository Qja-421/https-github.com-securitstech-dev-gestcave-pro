import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ShoppingBag, Receipt, 
  ChevronRight, ArrowRight, ShieldCheck, Zap, 
  Smartphone, BarChart3, Clock, LayoutDashboard,
  Mail, Phone, MapPin, Menu, X, Globe, Star,
  Server, Cpu, Lock, Send, Flame, BookOpen, Monitor, Terminal, Scale, Gavel, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, Timestamp, onSnapshot, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { Upload, ImageIcon, FileCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const PageAccueil = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [modalPaiement, setModalPaiement] = useState<{ ouvert: boolean, plan: string, prix: string } | null>(null);
  const [etapePaiement, setEtapePaiement] = useState<'choix' | 'mobile' | 'direction'>('choix');
  const [operateur, setOperateur] = useState<'airtel' | 'mtn' | null>(null);
  const [justificatif, setJustificatif] = useState('');
  const [modalLegal, setModalLegal] = useState<{ ouvert: boolean, titre: string, contenu: string } | null>(null);
  const [contactForm, setContactForm] = useState({ nom: '', contact: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [emailPaiement, setEmailPaiement] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

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

      toast.success("Paiement enregistré ! Nous validons votre accès.");
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
      console.error("Erreur d'envoi Firestore:", error);
      if (error.code === 'permission-denied') {
        toast.error("Erreur : Accès refusé par la base de données.");
      } else {
        toast.error("Erreur lors de l'envoi. Vérifiez votre connexion.");
      }
    } finally {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [activeSpots, setActiveSpots] = useState(3);
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'stats_public', 'plateforme'),
        (snap) => {
          setActiveSpots(Number(snap.data()?.etablissements_actifs) || 3);
        },
        (error) => {
          console.warn("stats_public inaccessible (mode démo/sécurité):", error.message);
          setActiveSpots(3);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn("Erreur souscription stats_public:", e);
    }
  }, []);

  const spotsRestants = Math.max(0, 10 - activeSpots);

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif] text-slate-700 overflow-x-hidden">
      {/* Banner Promotionnelle */}
      <div className="bg-[#1E3A8A] text-white py-3 px-6 relative z-[110] text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A00]/20 via-transparent to-[#FF7A00]/20 animate-pulse" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#FF7A00]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Offre de Lancement : -50% pour les 10 premiers</span>
          </div>
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold uppercase text-blue-200">Places restantes :</span>
             <div className="flex gap-1">
                {Array.from({length: 10}).map((_, i) => (
                  <div key={i} className={`w-3 h-5 rounded-sm flex items-center justify-center font-black text-[10px] ${i < activeSpots ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'}`}>
                    {i < activeSpots ? 'X' : i + 1}
                  </div>
                ))}
             </div>
             <span className="text-xs font-black text-[#FF7A00] ml-2">{spotsRestants} DISPONIBLES</span>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-blue-900/20" />
            <span className="font-bold text-xl tracking-tight text-[#1E3A8A]">GestCave Pro</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Services', 'Technologie', 'Abonnements', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-semibold hover:text-[#FF7A00] transition-colors">{item}</a>
            ))}
            <Link to="/connexion" className="text-sm font-bold text-[#1E3A8A] hover:opacity-70 transition-opacity">Se Connecter</Link>
            <button 
              onClick={() => {
                const { activerModeDemo } = useAuthStore.getState();
                activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                navigate('/tableau-de-bord');
                toast.success("Bienvenue dans la Démo GestCave Pro V2.0 !");
              }}
              className="px-6 py-2.5 bg-[#FF7A00] text-white rounded-full font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles size={14} /> Démo V2.0 Directe
            </button>
          </div>

          <button className="md:hidden text-[#1E3A8A]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100 py-4 px-6 flex flex-col gap-4 md:hidden">
            {['Services', 'Technologie', 'Abonnements', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold hover:text-[#FF7A00] transition-colors">{item}</a>
            ))}
            <hr className="border-slate-100" />
            <Link to="/connexion" className="text-sm font-bold text-[#1E3A8A]">Se Connecter</Link>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                const { activerModeDemo } = useAuthStore.getState();
                activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                navigate('/tableau-de-bord');
              }}
              className="px-6 py-3 bg-[#FF7A00] text-white rounded-full font-black text-xs text-center uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> Démo V2.0 Directe
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full text-[#1E3A8A] text-xs font-bold tracking-wide uppercase">
              <Star size={14} fill="currentColor" /> Ecosysteme de Gestion Premium 2.0
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1E3A8A] leading-[1.1] tracking-tight">
              Pilotez votre bar <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] to-[#FF7A00]">avec précision chirurgicale.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
              De la prise de commande intelligente à la gestion automatisée des dettes et de la paie. GestCave Pro harmonise vos Stocks, votre Cuisine, vos RH et vos Finances dans une suite souveraine unique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  const { activerModeDemo } = useAuthStore.getState();
                  activerModeDemo('client_admin', 'Gérant Étoile du Congo', 'admin');
                  navigate('/tableau-de-bord');
                  toast.success("Bienvenue dans la Démo GestCave Pro V2.0 !");
                }}
                className="px-8 py-5 bg-[#FF7A00] hover:bg-[#e06e00] text-white rounded-2xl font-black text-base shadow-xl shadow-orange-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Sparkles size={20} />
                Tester la Version 2.0 (Direct)
              </button>
              <button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-5 bg-white border-2 border-slate-200 text-[#1E3A8A] rounded-2xl font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Découvrir les Modules <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-20 bg-blue-100/50 rounded-full blur-3xl" />
             <div className="relative bg-[#1E3A8A] rounded-[2.5rem] p-4 shadow-2xl shadow-blue-900/20 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden aspect-[4/5] flex flex-col border border-white/20 relative group">
                   <img src="/images/flyer-gestcave.jpg" alt="Aperçu GestCave Pro" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="services" className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em]">Propulsez votre établissement</h2>
          <p className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight">Une suite logicielle intégrale.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard 
            icon={<ShoppingBag />} 
            title="Inventaire & Stocks" 
            desc="Suivi millimétré des bouteilles et ingrédients. Alertes de rupture et gestion des pertes pour une rentabilité maximale." 
          />
          <BenefitCard 
            icon={<Monitor />} 
            title="Écran Cuisine (KDS)" 
            desc="Finis les bons perdus. Un écran tactile en cuisine ou au bar pour gérer les commandes en temps réel avec chronomètre." 
          />
          <BenefitCard 
            icon={<Users />} 
            title="Pointage RH (PIN)" 
            desc="Borne autonome où vos employés badgent avec leur PIN unique. Calcul auto des salaires, retards et commissions." 
          />
          <BenefitCard 
            icon={<Receipt />} 
            title="Dettes & Arriérés" 
            desc="Gérez les avances clients et les ardoises. Relancez les débiteurs via WhatsApp et validez les paiements Mobile Money." 
          />
          <BenefitCard 
            icon={<BarChart3 />} 
            title="Finance & Grand Livre" 
            desc="Rapports financiers automatiques, P&L, et suivi des charges fixes. Une visibilité totale sur votre cash-flow." 
          />
          <BenefitCard 
            icon={<Scale />} 
            title="Conformité Étatique" 
            desc="Gérez vos taxes (Loisirs, Tourisme, Mairie) basées sur votre capacité. Soyez en règle avec la préfecture et le commerce." 
          />
          <BenefitCard 
            icon={<Terminal />} 
            title="Diagnostic & Lab" 
            desc="Console d'auto-diagnostic pour réparer les bugs instantanément et moteur de simulation pour prévoir vos revenus." 
          />
        </div>
      </section>

      {/* NEW: Fiscal Compliance Highlight Section */}
      <section className="py-24 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-[100px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00]/20 rounded-xl text-[#FF7A00] text-xs font-black uppercase tracking-widest">
                <ShieldCheck size={16} /> Exclusivité GestCave Pro
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase">
                Le Bouclier de <br/>
                <span className="text-[#FF7A00]">Conformité Étatique.</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed font-medium">
                Ne craignez plus les contrôles impromptus du Commerce, de la Mairie ou du BCDA. GestCave Pro intègre les réalités administratives de la République du Congo.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Calcul par Capacité", desc: "Taxes calculées automatiquement selon votre nombre de chaises." },
                  { title: "Gestion des Tutelles", desc: "Différenciation Loisirs vs Tourisme selon votre type de bar/cave." },
                  { title: "Suivi BCDA & Impôts", desc: "Alertes sur les paiements trimestriels et annuels pour éviter les pénalités." },
                  { title: "Checklist Documents", desc: "Vérifiez la présence physique du RCCM, Patente et Agréments." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-[#FF7A00]/20 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#FF7A00]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm uppercase mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FF7A00] to-orange-400 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#1E3A8A]/20 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Gavel size={32} className="text-[#FF7A00]" />
                  </div>
                  <div className="text-right">
                    <div className="text-[#FF7A00] font-black text-xs uppercase tracking-widest">Statut Fiscal</div>
                    <div className="text-white font-black text-2xl">100% CONFORME</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Autorisation Exploitation", status: "Payé", color: "bg-emerald-500" },
                    { label: "Droits d'Auteur (BCDA)", status: "À jour", color: "bg-emerald-500" },
                    { label: "Licence Alcool", status: "En cours", color: "bg-amber-500" },
                    { label: "Taxe Municipale", status: "Vérifié", color: "bg-emerald-500" }
                  ].map((tax, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-slate-300 font-bold text-xs uppercase">{tax.label}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${tax.color}`}>{tax.status}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Phone size={18} />
                  </div>
                  <p className="text-xs text-slate-400">Support local basé à <strong>Pointe-Noire</strong> pour vous assister avec l'administration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles / Workflow Section */}
      <section className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20 space-y-4">
              <h2 className="text-xs font-black text-[#1E3A8A] uppercase tracking-[0.4em]">L'Harmonie Opérationnelle</h2>
              <p className="text-4xl font-extrabold text-[#1E3A8A]">Un rôle pour chaque terminal.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { role: "Serveur", icon: <Smartphone />, desc: "Prise de commande sur mobile/tablette à la table.", color: "bg-blue-500" },
                { role: "Cuisine / Bar", icon: <Monitor />, desc: "Réception et préparation instantanée via l'écran KDS.", color: "bg-orange-500" },
                { role: "Caissier", icon: <Receipt />, desc: "Encaissement, acomptes, dettes et clôture de session.", color: "bg-[#1E3A8A]" },
                { role: "Manager", icon: <LayoutDashboard />, desc: "Pilotage global, stocks, RH et rapports financiers.", color: "bg-emerald-600" }
              ].map((r, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all">
                   <div className={`w-14 h-14 ${r.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/10`}>
                      {r.icon}
                   </div>
                   <h4 className="text-lg font-black text-[#1E3A8A] uppercase mb-3">{r.role}</h4>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Technologie Section */}
      <section id="technologie" className="py-32 bg-[#1E3A8A] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-800/20 blur-[100px] rounded-full" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-4">Infrastructure Premium</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-orange-300">
                La puissance du Cloud, <br/> la robustesse du Local.
              </h3>
              <p className="text-blue-100/80 text-lg leading-relaxed mb-10">
                GestCave Pro fusionne la flexibilité du Cloud avec une résilience locale. Votre établissement ne s'arrête jamais, même sans internet.
              </p>
              
              <div className="space-y-6">
                <TechItem icon={<Server />} title="Cloud Distribué" desc="Synchronisation multi-sites instantanée via Firebase Production." />
                <TechItem icon={<Cpu />} title="Intelligence & Lab" desc="Moteur de simulation intégré pour prévoir vos stocks et vos revenus." />
                <TechItem icon={<ShieldCheck />} title="Audit Sécurisé" desc="Chaque centime est tracé. Protection contre la fraude et les erreurs de saisie." />
              </div>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] to-transparent z-10" />
               <div className="grid grid-cols-2 gap-4 opacity-30 transform rotate-12 scale-110">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-32 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md" />
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offre de Lancement Details */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/20 border-8 border-slate-50 relative group cursor-pointer hover:shadow-orange-500/20 transition-all duration-500" onClick={() => document.getElementById('abonnements')?.scrollIntoView({ behavior: 'smooth' })}>
            <img src="/images/promo-lancement.jpg" alt="Offre de Lancement GestCave Pro - 3 Mois à 25 000 XAF/MOIS" className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
          </div>

          <div className="bg-gradient-to-br from-[#1E3A8A] to-blue-900 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-blue-900/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full text-[#FF7A00] text-sm font-black uppercase tracking-widest border border-white/10">
                  <Sparkles size={18} /> Offre Spéciale de Lancement
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-tight uppercase tracking-tighter">
                  Soyez parmi les <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-orange-300">10 Pionniers.</span>
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-[#FF7A00] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                      <Clock size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold uppercase mb-2">3 Mois de Privilèges</h4>
                      <p className="text-blue-100/70 leading-relaxed">Les 10 premiers abonnés bénéficient d'un tarif préférentiel garanti pendant les 3 premiers mois de leur activité.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                      <Zap size={24} className="text-[#FF7A00]" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold uppercase mb-2">Accès Prioritaire</h4>
                      <p className="text-blue-100/70 leading-relaxed">Support technique VIP et intégration personnalisée de vos menus et stocks par nos experts à Pointe-Noire.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[3rem] text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-[#FF7A00] font-black text-xs uppercase tracking-[0.3em]">Places Disponibles</p>
                  <p className="text-7xl font-black tracking-tighter">{spotsRestants} / 10</p>
                </div>
                
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                  <div className="h-full bg-gradient-to-r from-[#FF7A00] to-orange-300 rounded-full transition-all duration-1000" style={{ width: `${(activeSpots / 10) * 100}%` }} />
                </div>

                <div className="pt-8 border-t border-white/10">
                  <button 
                    onClick={() => document.getElementById('abonnements')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-6 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-orange-500/20"
                  >
                    Saisir l'opportunité
                  </button>
                  <p className="mt-6 text-[10px] font-bold text-blue-200/50 uppercase tracking-widest italic">
                    * Offre soumise à validation par la direction commerciale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="abonnements" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-6 mb-16">
            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>Mensuel</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className="w-16 h-8 bg-[#1E3A8A]/10 rounded-full p-1 relative transition-colors"
            >
              <div className={`w-6 h-6 bg-[#1E3A8A] rounded-full shadow-lg transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'annually' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
              Annuel <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight">-20%</span>
            </span>
          </div>

          {/* Headline des prix */}
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight">Une formule pour chaque ambition.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Choisissez votre formule et démarrez un essai gratuit de <span className="font-bold text-[#FF7A00]">14 jours</span> avec accès complet. Aucune carte bancaire requise.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Plan Solo */}
            <PriceCard 
              name="Solo" 
              price={billingCycle === 'monthly' ? "9.999" : "99.999"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              badge="Mini-Bar / Cave"
              features={['1 Utilisateur (Patron)', 'Caisse Express (1 clic)', 'Suivi Stocks & Alertes', 'Mode Papier (PDF)', 'Fonctionne Hors-Ligne']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Solo', prix: billingCycle === 'monthly' ? "9.999" : "99.999" })}
              promo={spotsRestants > 0}
            />
            <PriceCard 
              name="Starter" 
              price={billingCycle === 'monthly' ? "30.000" : "300.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              features={['1 Établissement', 'Gestion Stocks de base', '100 Commandes/jour', 'Mode Hybride (Papier)', 'Support Email']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Starter', prix: billingCycle === 'monthly' ? "30.000" : "300.000" })}
              promo={spotsRestants > 0}
            />
            <PriceCard 
              name="Premium" 
              price={billingCycle === 'monthly' ? "55.000" : "550.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              isRecommended 
              features={['3 Établissements', 'Stocks avancés + Ingrédients', 'Commandes illimitées', 'Rapports PDF exports', 'Support 24/7']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Premium', prix: billingCycle === 'monthly' ? "55.000" : "550.000" })}
              promo={spotsRestants > 0}
            />
            <PriceCard 
              name="Business" 
              price={billingCycle === 'monthly' ? "95.000" : "950.000"} 
              duration={billingCycle === 'monthly' ? "MOIS" : "AN"}
              features={['Établissements illimités', 'Gestion Multi-niveaux', 'Salaires & RH auto', 'Audit complet', 'Support Prioritaire']}
              onClick={() => setModalPaiement({ ouvert: true, plan: 'Business', prix: billingCycle === 'monthly' ? "95.000" : "950.000" })}
              promo={spotsRestants > 0}
            />
          </div>
        </div>
      </section>

      {/* Modal Paiement */}
      {modalPaiement?.ouvert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div onClick={() => setModalPaiement(null)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="bg-white w-full max-w-2xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            <button onClick={() => setModalPaiement(null)} className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] rounded-2xl transition-all">
              <X size={24} />
            </button>

            <div className="text-center mb-10">
               <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Finaliser mon abonnement</h3>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{modalPaiement.plan} • {modalPaiement.prix} XAF</p>
            </div>

            {etapePaiement === 'choix' && (
              <div className="space-y-4">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-8">Choisissez votre mode de règlement</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setEtapePaiement('mobile'); setOperateur('airtel'); }}
                      className="p-8 bg-rose-50 border-2 border-rose-100 rounded-3xl flex flex-col items-center gap-4 hover:border-rose-300 transition-all group"
                    >
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <img src="/logo_airtel.png" alt="Airtel" className="w-10 h-10 object-contain" />
                       </div>
                       <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">Airtel Money</span>
                    </button>
                    <button 
                      onClick={() => { setEtapePaiement('mobile'); setOperateur('mtn'); }}
                      className="p-8 bg-amber-50 border-2 border-amber-100 rounded-3xl flex flex-col items-center gap-4 hover:border-amber-300 transition-all group"
                    >
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <img src="/logo_mtn.png" alt="MTN" className="w-10 h-10 object-contain" />
                       </div>
                       <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">MTN MoMo</span>
                    </button>
                 </div>
                 <button 
                    onClick={() => setEtapePaiement('direction')}
                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-center gap-4 hover:border-blue-200 transition-all"
                 >
                    <MapPin size={24} className="text-[#1E3A8A]" />
                    <span className="font-black text-[#1E3A8A] uppercase tracking-widest text-xs">Payer à la direction</span>
                 </button>
              </div>
            )}

            {etapePaiement === 'mobile' && (
               <div className="space-y-6">
                  <div className={`p-6 rounded-[2rem] text-center ${operateur === 'airtel' ? 'bg-rose-50' : 'bg-amber-50'}`}>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Transfert Mobile</p>
                     <p className="text-xl font-black text-[#1E3A8A]">Envoyez au : <span className="text-[#FF7A00]">{operateur === 'airtel' ? '05 302 83 83' : '06 902 44 44'}</span></p>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Votre Email (pour l'activation)</label>
                     <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A]">
                           <Mail size={18} />
                        </div>
                        <input 
                           required
                           type="email" 
                           value={emailPaiement}
                           onChange={(e) => setEmailPaiement(e.target.value)}
                           placeholder="votre@email.com"
                           className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#1E3A8A] transition-all font-bold text-sm"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Justification (ID Transaction / Nom)</label>
                     <textarea 
                        value={justificatif}
                        onChange={(e) => setJustificatif(e.target.value)}
                        placeholder="Ex: ID 92837482 - Cave de la Paix"
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-[#1E3A8A] transition-all font-bold text-sm"
                        rows={3}
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Capture d'écran du transfert (Optionnel)</label>
                     <div className="relative">
                        <input 
                           type="file" 
                           accept="image/*" 
                           onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                           className="hidden" 
                           id="screenshot-upload"
                        />
                        <label 
                           htmlFor="screenshot-upload"
                           className={`w-full p-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                              screenshotFile ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200'
                           }`}
                        >
                           {screenshotFile ? (
                              <>
                                 <FileCheck size={32} />
                                 <span className="text-xs font-bold uppercase tracking-tight">Capture jointe : {screenshotFile.name.substring(0, 20)}...</span>
                              </>
                           ) : (
                              <>
                                 <Upload size={32} />
                                 <span className="text-xs font-bold uppercase tracking-tight">Cliquez pour joindre la preuve</span>
                              </>
                           )}
                        </label>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button 
                        onClick={() => setEtapePaiement('choix')} 
                        disabled={uploadProgress}
                        className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs"
                     >
                        Retour
                     </button>
                     <button 
                        onClick={handlePaiementMobile}
                        disabled={uploadProgress}
                        className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2"
                     >
                        {uploadProgress ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Traitement...
                           </>
                        ) : (
                           "Valider mon paiement"
                        )}
                     </button>
                  </div>
               </div>
            )}

            {etapePaiement === 'direction' && (
               <div className="space-y-8 text-center">
                  <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mx-auto shadow-inner">
                     <MapPin size={40} />
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">Adresse de la Direction</h4>
                     <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
                        <div className="flex gap-4">
                           <MapPin className="text-[#FF7A00] flex-shrink-0" size={24} />
                           <p className="text-slate-600 font-bold leading-relaxed">
                             Bâtiment de la préfecture en face du trésor <br/>
                             À la direction départementale des loisirs de pointe-noire
                           </p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                           <ShieldCheck className="text-[#1E3A8A] flex-shrink-0" size={24} />
                           <p className="text-xs font-bold text-[#1E3A8A] leading-relaxed italic">
                             "Une fois sur place, nous encaissons le montant de l'abonnement contre un reçu officiel. Votre application sera débloquée instantanément."
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setEtapePaiement('choix')} className="flex-1 h-16 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs">Retour</button>
                     <button 
                        onClick={() => setModalPaiement(null)}
                        className="flex-[2] h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10"
                     >
                        J'ai compris
                     </button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Section */}
      <section id="inscription" className="py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E3A8A]">Prêt à transformer votre bar ?</h2>
          <p className="text-slate-500 text-lg">Inscrivez-vous pour un essai gratuit de 14 jours. Aucune carte bancaire requise. Nos experts vous accompagnent pour la mise en place.</p>
          <div className="p-2 bg-gradient-to-br from-[#1E3A8A] to-blue-900 rounded-[3.5rem] shadow-2xl shadow-blue-900/20">
            <InscriptionDirecte />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-xs font-black text-[#FF7A00] uppercase tracking-[0.4em] mb-4">Support & Commercial</h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-[#1E3A8A] mb-8">
              Une question ? <br/> Contactez-nous.
            </h3>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Notre équipe technique est basée à <strong>Pointe-Noire</strong> et se tient prête à venir faire une démonstration gratuite directement dans votre établissement.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Téléphone (WhatsApp)</p>
                  <p className="text-xl font-bold text-[#1E3A8A]">+242 06 881 7104</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Email Pro</p>
                  <p className="text-lg font-bold text-[#1E3A8A]">securitstech@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-orange-50 text-[#FF7A00] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Siège Social</p>
                  <p className="text-sm font-bold text-[#1E3A8A] leading-tight">Bâtiment de la Préfecture, face au Trésor, Pointe-Noire</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <form className="space-y-6" onSubmit={handleSubmitContact}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Nom Complet</label>
                <input required type="text" placeholder="Jean Dupont" value={contactForm.nom} onChange={e => setContactForm({...contactForm, nom: e.target.value})} className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Email ou Téléphone</label>
                <input required type="text" placeholder="Pour vous recontacter" value={contactForm.contact} onChange={e => setContactForm({...contactForm, contact: e.target.value})} className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                <textarea required rows={4} placeholder="Comment pouvons-nous vous aider ?" value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1E3A8A] outline-none transition-colors" />
              </div>
              <button type="submit" disabled={contactLoading} className="w-full h-14 bg-[#1E3A8A] text-white rounded-xl font-bold hover:bg-[#FF7A00] transition-colors flex items-center justify-center gap-2">
                {contactLoading ? 'Envoi...' : 'Envoyer le message'} <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-[#0F172A] text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <img src="/logo_gestcave.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                <span className="font-bold text-2xl tracking-tight">GestCave Pro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Le système d'exploitation souverain pour les établissements de loisirs. Conçu pour la performance, audité pour la sécurité.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Globe size={18} /></div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Mail size={18} /></div>
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-[#FF7A00] transition-colors cursor-pointer"><Phone size={18} /></div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Solution</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><a href="#services" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#technologie" className="hover:text-white transition-colors">Infrastructure Cloud</a></li>
                <li><a href="#abonnements" className="hover:text-white transition-colors">Tarifs & Plans</a></li>
                <li><a href="/connexion" className="hover:text-white transition-colors">Portail Client</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Légal & Protection</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Mentions Légales", contenu: `Éditeur : Securits Technologies SARL\nGérant : Jacques Alphonse MATOKO\nSiège : Bâtiment de la Préfecture, Pointe-Noire, Congo.\nÉquipe Technique : Agents experts de la Direction des Loisirs de Pointe-Noire.\nHébergement : Infrastructure Cloud Vercel/Firebase (Google Cloud).` })} className="hover:text-white transition-colors">Mentions Légales</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Confidentialité", contenu: `Engagement de Confidentialité :\n1. Securits Technologies SARL garantit que les données financières, de stocks et de personnel sont traitées exclusivement pour le fonctionnement du service.\n2. Aucune donnée n'est cédée, vendue ou utilisée à des fins de surveillance commerciale.\n3. Cryptage de bout en bout des transactions sensibles.` })} className="hover:text-white transition-colors">Politique de Confidentialité</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Conditions d'Utilisation", contenu: `Clauses de Protection GestCave Pro :\n- Propriété Intellectuelle : Interdiction formelle de copier, reproduire ou analyser la logique de l'application (Reverse Engineering).\n- Paiements : Tout paiement donne lieu à un reçu officiel à l'entête de Securits Tech.\n- Activation : Les preuves de paiement mobile sont vérifiées par nos agents sous 30 minutes.\n- Limitation de Responsabilité : Notre responsabilité est plafonnée au montant du dernier mois d'abonnement payé par le client.\n- Suspension : En cas de défaut de paiement, l'accès est suspendu après un préavis de 48 heures.` })} className="hover:text-white transition-colors">Conditions (CGU)</button></li>
                <li><button onClick={() => setModalLegal({ ouvert: true, titre: "Audit & Sécurité", contenu: "Dispositif Anti-Fraude :\nLe système GestCave Pro intègre des protocoles d'audit permanent pour détecter et prévenir les détournements de fonds et les erreurs de caisse au sein de votre établissement." })} className="hover:text-white transition-colors">Rapport de Sécurité</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.3em] text-[#FF7A00] mb-8">Siège Social</h4>
              <p className="text-sm font-bold text-slate-400 leading-relaxed">
                Bâtiment de la Préfecture<br/>
                Face au Trésor Public<br/>
                Direction des Loisirs<br/>
                Pointe-Noire, Congo
              </p>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              © 2026 Securits Tech • Tous droits réservés
            </p>
            <div className="flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Fait avec excellence au Congo</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Système Opérationnel</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Légal */}
      {modalLegal?.ouvert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div onClick={() => setModalLegal(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
          <div className="bg-white w-full max-w-xl p-12 rounded-[2.5rem] shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto max-h-[80vh]">
            <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight mb-6 border-b pb-4 border-slate-100">{modalLegal.titre}</h3>
            <div className="prose prose-slate mb-8">
              <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-line text-sm">{modalLegal.contenu}</p>
            </div>
            <button 
              onClick={() => setModalLegal(null)}
              className="w-full h-14 bg-[#1E3A8A] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#FF7A00] transition-colors"
            >
              J'ai pris connaissance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-10 bg-white rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
      {React.cloneElement(icon as any, { size: 28 })}
    </div>
    <h3 className="text-xl font-bold text-[#1E3A8A] mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
  </div>
);

const TechItem = ({ icon, title, desc }: any) => (
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-blue-100/70 text-sm">{desc}</p>
    </div>
  </div>
);

const PriceCard = ({ name, price, duration = 'MOIS', features, onClick, isRecommended = false, promo = false, badge }: any) => (
  <div className={`p-8 rounded-[2.5rem] relative flex flex-col transition-all ${
    name === 'Solo' 
      ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10' 
      : isRecommended 
        ? 'bg-white shadow-2xl z-10 scale-105 border-2 border-[#1E3A8A]' 
        : 'bg-white border border-slate-100 hover:border-blue-100 hover:shadow-lg'
  }`}>
    {/* Badge type d'établissement */}
    {badge && (
      <div className="absolute -top-3 left-6 bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
        {badge}
      </div>
    )}
    {isRecommended && !badge && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF7A00] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Le Plus Populaire</div>}
    {promo && !badge && (
      <div className="absolute -top-4 right-6 bg-[#FF7A00] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-bounce">
        Pionnier
      </div>
    )}
    <h4 className={`font-black text-xl mb-2 mt-2 ${name === 'Solo' ? 'text-emerald-700' : 'text-[#1E3A8A]'}`}>{name}</h4>
    <div className="mb-8 mt-4">
        <span className={`text-4xl font-black tracking-tighter ${name === 'Solo' ? 'text-emerald-600' : 'text-[#1E3A8A]'}`}>{price}</span>
        <span className="text-slate-400 font-bold text-xs ml-1">XAF / {duration}</span>
    </div>
    <ul className="space-y-3 mb-8 flex-grow">
      {features.map((f: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-500">
           <CheckCircle2 size={15} className={name === 'Solo' ? 'text-emerald-500 flex-shrink-0' : 'text-[#10B981] flex-shrink-0'} />
           {f}
        </li>
      ))}
    </ul>
    <button 
      onClick={onClick} 
      className={`w-full h-16 rounded-2xl font-bold text-sm transition-all ${isRecommended ? 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800' : 'bg-slate-100 text-[#1E3A8A] hover:bg-slate-200'}`}
    >
      Démarrer maintenant
    </button>
  </div>
);

const InscriptionDirecte = () => {
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [formData, setFormData] = useState({
    nom_etablissement: '',
    adresse_etablissement: '',
    telephone_contact: '',
    nom_contact: '',
    email_contact: '',
    accepte_cgu: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'demandes_acces'), {
        ...formData,
        statut: 'en_attente',
        date_demande: Timestamp.now(),
      });
      setEnvoye(true);
      toast.success("Demande envoyée avec succès");
    } catch (error: any) {
      console.error("Erreur d'inscription Firestore:", error);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (envoye) return (
    <div className="bg-white p-12 rounded-[3rem]">
      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="text-emerald-500" size={40} />
      </div>
      <h3 className="text-3xl font-bold mb-4 text-[#1E3A8A]">Demande Reçue !</h3>
      <p className="text-slate-500 font-medium">Nos équipes analysent votre dossier. Vous recevrez un email d'activation sous 24h.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-10 md:p-14 rounded-[3rem] text-slate-800 text-left grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Établissement</label>
        <input required type="text" placeholder="Nom de votre bar/resto" value={formData.nom_etablissement} onChange={e => setFormData({...formData, nom_etablissement: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Localisation</label>
        <input required type="text" placeholder="Ville, Quartier" value={formData.adresse_etablissement} onChange={e => setFormData({...formData, adresse_etablissement: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Responsable</label>
        <input required type="text" placeholder="Votre nom complet" value={formData.nom_contact} onChange={e => setFormData({...formData, nom_contact: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Téléphone</label>
        <input required type="tel" placeholder="+242 0x xxx xx xx" value={formData.telephone_contact} onChange={e => setFormData({...formData, telephone_contact: e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 px-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email Professionnel (Activation & Mot de passe)</label>
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
            <Mail size={18} />
          </div>
          <input 
            required 
            type="email" 
            placeholder="votre@email.com" 
            value={formData.email_contact} 
            onChange={e => setFormData({...formData, email_contact: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl h-14 pl-14 pr-6 outline-none focus:border-[#1E3A8A] transition-colors font-medium" 
          />
        </div>
      </div>
      <div className="md:col-span-2 space-y-4 pt-4">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center pt-1">
            <input 
              required 
              type="checkbox" 
              checked={formData.accepte_cgu} 
              onChange={e => setFormData({...formData, accepte_cgu: e.target.checked})}
              className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 bg-slate-50 transition-all checked:border-[#1E3A8A] checked:bg-[#1E3A8A] focus:outline-none"
            />
            <CheckCircle2 size={16} className="pointer-events-none absolute left-1 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            Je certifie l'exactitude de ces informations et j'accepte les <span className="text-[#1E3A8A] underline">Conditions Générales d'Utilisation</span> de GestCave Pro pour protéger mon établissement et garantir la sécurité de mes données.
          </p>
        </label>
      </div>
      <div className="md:col-span-2 pt-2">
        <button type="submit" disabled={loading} className="w-full h-16 bg-[#FF7A00] text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100">
          {loading ? 'Traitement en cours...' : 'Envoyer ma Demande d\'Accès'}
        </button>
      </div>
    </form>
  );
};

export default PageAccueil;
