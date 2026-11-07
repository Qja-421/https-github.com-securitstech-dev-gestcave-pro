import React, { useState } from 'react';
import { 
  Smartphone, Upload, CreditCard, CheckCircle2, 
  Copy, Info, ArrowLeft, Zap, ShieldCheck, 
  Clock, TrendingUp, Sparkles, X, ChevronRight,
  UserCheck, PlusCircle, ArrowRight, Building2,
  Shield, Receipt, ShieldAlert, Award,
  Check, Globe, Star, Landmark, Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PageAbonnement = () => {
  const { profil } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [etape, setEtape] = useState(1);
  const [annuel, setAnnuel] = useState(searchParams.get('period') === 'annuel');

  const [chargement, setChargement] = useState(false);
  const [forfaitChoisi, setForfaitChoisi] = useState<any>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [methodePaiement, setMethodePaiement] = useState<'mobile' | 'direction' | null>(null);

  const forfaits = [
    { 
      id: 'starter', 
      nom: 'Pack Essentiel', 
      prix_mensuel: '15 000 XAF',
      prix_annuel: '144 000 XAF',
      montant_mensuel: 15000,
      montant_annuel: 144000,
      desc: 'Idéal pour les petits bars et caves débutants.',
      features: ['1 Terminal de vente', 'Gestion des stocks', 'Rapports quotidiens', 'Support Standard'],
    },
    { 
      id: 'premium', 
      nom: 'Pack Performance', 
      prix_mensuel: '30 000 XAF',
      prix_annuel: '288 000 XAF',
      montant_mensuel: 30000,
      montant_annuel: 288000,
      desc: 'Pour les établissements en pleine croissance.',
      features: ['Multi-Postes Illimités', 'Gestion du Personnel', 'IA prédictive de stock', 'Support Prioritaire'],
      populaire: true,
    },
    { 
      id: 'business', 
      nom: 'Pack Empire', 
      prix_mensuel: '60 000 XAF',
      prix_annuel: '576 000 XAF',
      montant_mensuel: 60000,
      montant_annuel: 576000,
      desc: 'Gouvernance multi-sites et multi-établissements.',
      features: ['Nombre de sites illimités', 'Consolidation Globale', 'Audit de sécurité mensuel', 'Manager dédié 24/7'],
    },
  ];

  const [message, setMessage] = useState('');
  const [apercu, setApercu] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFichier(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setApercu(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const envoyerPaiement = async () => {
    if (!forfaitChoisi) return;
    if (!fichier && methodePaiement === 'mobile') {
      toast.error('Veuillez joindre une preuve de paiement (capture d\'écran)');
      return;
    }
    setChargement(true);
    
    try {
      let urlPreuve = "";
      if (fichier) {
        const extension = fichier.name.split('.').pop();
        const nomFichier = `preuves/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const imageRef = ref(storage, nomFichier);
        const snapshot = await uploadBytes(imageRef, fichier);
        urlPreuve = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'paiements'), {
        etablissement_id: profil?.etablissement_id || '',
        etablissement_nom: profil?.etablissement_nom || '',
        montant: annuel ? forfaitChoisi.montant_annuel : forfaitChoisi.montant_mensuel,
        statut: 'en_attente',
        preuve_url: urlPreuve,
        methode: methodePaiement,
        periode: annuel ? 'annuel' : 'mensuel',
        email: profil?.email || '',
        message: message,
        date: new Date().toISOString()
      });
      
      toast.success('Paiement envoyé ! Un administrateur va valider votre accès.');
      setEtape(4);
    } catch (erreur: any) {
      console.error(erreur);
      toast.error('Erreur lors de l\'envoi du paiement');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] text-slate-800 pb-24">
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-[#1E3A8A] overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] -mr-96 -mt-96" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10 pt-20">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-white/60 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-12">
            <ArrowLeft size={16} /> Revenir en arrière
          </button>

          <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-blue-100 text-[10px] font-black uppercase tracking-widest border border-white/10">
                 <Award size={14} className="text-[#FF7A00]" /> Plans de Licence GestCave
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                 Élevez votre <span className="text-[#FF7A00]">Standard.</span>
              </h1>
              <p className="text-blue-100/60 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                 Choisissez la puissance adaptée à votre ambition. Pas de frais cachés, que de la performance brute.
              </p>
          </div>

          <div className="flex justify-center mb-16">
              <div className="bg-white/5 backdrop-blur-xl p-2 rounded-[2rem] border border-white/10 flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`px-6 py-3 rounded-[1.5rem] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                        etape === s 
                        ? 'bg-[#FF7A00] text-white shadow-lg shadow-orange-500/20' 
                        : etape > s ? 'bg-emerald-500 text-white' : 'text-white/30'
                    }`}>
                        {etape > s ? <Check size={14} /> : <span>0{s}</span>}
                        {s === 1 ? 'Forfait' : s === 2 ? 'Méthode' : 'Validation'}
                    </div>
                  ))}
              </div>
          </div>

          <div className="max-w-6xl mx-auto">
              {etape === 1 && (
                  <div className="space-y-12 animate-in zoom-in-95 duration-500">
                      <div className="flex justify-center items-center gap-6">
                          <span className={`text-sm font-bold ${!annuel ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>Mensuel</span>
                          <button onClick={() => setAnnuel(!annuel)} className="w-16 h-8 bg-slate-200 rounded-full p-1 relative transition-colors">
                              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${annuel ? 'translate-x-8 bg-[#FF7A00]' : ''}`} />
                          </button>
                          <span className={`text-sm font-bold ${annuel ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>Annuel <span className="text-[#FF7A00] ml-1">(-20%)</span></span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {forfaits.map((f) => (
                              <div key={f.id} className={`bg-white rounded-[3.5rem] p-12 border-2 transition-all flex flex-col justify-between group ${
                                f.populaire ? 'border-[#FF7A00] shadow-2xl shadow-orange-900/10' : 'border-slate-100 shadow-xl shadow-blue-900/5 hover:border-blue-200'
                              }`}>
                                  {f.populaire && (
                                      <div className="bg-[#FF7A00] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full self-start mb-6 -mt-16 ml-4">Le plus choisi</div>
                                  )}
                                  <div>
                                      <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">{f.nom}</h3>
                                      <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{f.desc}</p>
                                      
                                      <div className="mb-10">
                                          <p className="text-4xl font-black text-[#1E3A8A] tracking-tighter">{annuel ? f.prix_annuel : f.prix_mensuel}</p>
                                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">HT par {annuel ? 'an' : 'mois'}</p>
                                      </div>

                                      <ul className="space-y-4">
                                          {f.features.map((feat, i) => (
                                              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                                  <div className="w-5 h-5 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center shrink-0">
                                                      <Check size={12} />
                                                  </div>
                                                  {feat}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>

                                  <button onClick={() => { setForfaitChoisi(f); setEtape(2); }}
                                      className={`w-full h-16 rounded-[1.5rem] mt-12 font-black uppercase tracking-widest text-xs transition-all ${
                                        f.populaire 
                                        ? 'bg-[#1E3A8A] text-white shadow-xl shadow-blue-900/20 hover:bg-blue-800' 
                                        : 'bg-slate-50 text-[#1E3A8A] hover:bg-blue-50'
                                      }`}
                                  >
                                      Sélectionner
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {etape === 2 && (
                  <div className="max-w-4xl mx-auto bg-white p-16 rounded-[4rem] shadow-2xl shadow-blue-900/10 border border-slate-100 animate-in slide-in-from-right duration-500">
                      <div className="text-center mb-12">
                          <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Méthode de Paiement</h3>
                          <p className="text-slate-400 font-medium">Forfait choisi : <span className="text-[#FF7A00] font-black">{forfaitChoisi.nom}</span></p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <button onClick={() => setMethodePaiement('mobile')}
                            className={`p-10 rounded-[2.5rem] border-2 text-left transition-all ${
                              methodePaiement === 'mobile' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-slate-100 hover:border-blue-100'
                            }`}
                          >
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 shadow-inner"><Smartphone size={32} /></div>
                              <h4 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Mobile Money</h4>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed">Orange Money ou Mobile Money. Capture d'écran requise.</p>
                          </button>

                          <button onClick={() => setMethodePaiement('direction')}
                            className={`p-10 rounded-[2.5rem] border-2 text-left transition-all ${
                              methodePaiement === 'direction' ? 'border-[#1E3A8A] bg-blue-50/30' : 'border-slate-100 hover:border-blue-100'
                            }`}
                          >
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#FF7A00] mb-8 shadow-inner"><Landmark size={32} /></div>
                              <h4 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Direction Physique</h4>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed">Paiement en espèces dans nos bureaux Securits Technologies.</p>
                          </button>
                      </div>

                      <div className="mt-12 flex justify-between gap-6">
                          <button onClick={() => setEtape(1)} className="h-16 px-10 text-slate-400 font-black uppercase tracking-widest text-xs">Précédent</button>
                          <button onClick={() => setEtape(3)} disabled={!methodePaiement} className="flex-1 h-16 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 disabled:opacity-30">Continuer</button>
                      </div>
                  </div>
              )}

              {etape === 3 && (
                  <div className="max-w-2xl mx-auto bg-white p-16 rounded-[4rem] shadow-2xl shadow-blue-900/10 border border-slate-100 animate-in slide-in-from-bottom-10 duration-500">
                      <div className="text-center mb-12">
                          <div className="w-20 h-20 bg-blue-50 text-[#1E3A8A] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><Upload size={32} /></div>
                          <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">Finalisation</h3>
                          <p className="text-slate-400 font-medium">Veuillez joindre votre preuve de paiement</p>
                      </div>

                      {methodePaiement === 'mobile' && (
                          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 mb-10 text-center">
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Compte Mobile Money</p>
                              <p className="text-3xl font-black text-[#1E3A8A] tracking-tighter">6 95 62 47 43</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-2">Nom : Securits Tech</p>
                          </div>
                      )}

                      <div className="space-y-8">
                          <div className="relative group">
                              <input type="file" id="upload" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                              <label htmlFor="upload" className="w-full min-h-[128px] bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-6 gap-2 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all overflow-hidden">
                                  {apercu ? (
                                      <div className="relative w-full h-full flex flex-col items-center gap-4">
                                          <img src={apercu} alt="Preuve" className="max-h-40 rounded-xl shadow-lg" />
                                          <span className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest">Changer le fichier</span>
                                      </div>
                                  ) : (
                                      <>
                                          <PlusCircle size={32} className="text-[#1E3A8A]" />
                                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Cliquez pour joindre une capture <br/> ou un fichier</span>
                                      </>
                                  )}
                              </label>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Message / Commentaire (Optionnel)</label>
                              <textarea 
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  placeholder="Ex: Paiement effectué par [Votre Nom]..."
                                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-[#1E3A8A] transition-all font-bold text-sm min-h-[100px]"
                              />
                          </div>

                          <button 
                              onClick={envoyerPaiement}
                              disabled={chargement || (methodePaiement === 'mobile' && !fichier)}
                              className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                              {chargement ? (
                                  <><Loader2 className="animate-spin" size={20} /> Envoi en cours...</>
                              ) : (
                                  <><CheckCircle2 size={20} /> Valider mon paiement</>
                              )}
                          </button>

                          <div className="pt-8 flex justify-between items-center border-t border-slate-100">
                              <button onClick={() => setEtape(2)} className="text-slate-400 font-black uppercase tracking-widest text-xs">Retour</button>
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest max-w-[200px] text-right leading-relaxed">
                                  L'activation sera effective après vérification sous 2h ouvrables.
                              </p>
                          </div>
                      </div>
                  </div>
              )}

              {etape === 4 && (
                  <div className="max-w-xl mx-auto bg-white p-20 rounded-[4rem] shadow-2xl text-center animate-in zoom-in-95 duration-700">
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-500/10">
                          <Check size={48} />
                      </div>
                      <h3 className="text-4xl font-black text-[#1E3A8A] tracking-tighter uppercase mb-6">Demande Reçue !</h3>
                      <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12">
                          Nos agents vérifient actuellement votre transaction. Vous recevrez une notification d'activation par email très prochainement.
                      </p>
                      <button onClick={() => navigate('/tableau-de-bord')}
                          className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all"
                      >
                          Retour au Dashboard
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default PageAbonnement;
