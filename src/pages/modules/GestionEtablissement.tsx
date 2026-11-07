import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Building2, MapPin, Phone, 
  Store, Save, Image, Globe, Mail, 
  Clock, ShieldCheck, Heart, Activity,
  Sparkles, Landmark, ArrowRight, CheckCircle2,
  Share2, ShieldAlert
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const GestionEtablissement = () => {
  const { profil } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    logo: '',
    siteWeb: '',
    horaires: '',
    description: '',
    heureOuvertureStandard: '08:00',
    toleranceRetard: 5,
    malusRetardParMinute: 100,
    seuilRetardRepetitif: 3,
    multiplicateurMalusRepetitif: 2,
    type_etablissement: 'bar_restaurant', // boutique, bar_restaurant, mixte
    tva_taux: 18,
    taxe_loisirs_taux: 5,
    taxe_tourisme_taux: 2,
    cnss_taux: 16.5,
    is_taux: 30
  });

  useEffect(() => {
    const fetchEtab = async () => {
      if (!profil?.etablissement_id) return;
      try {
        const docRef = doc(db, 'etablissements', profil.etablissement_id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFormData(snap.data() as any);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEtab();
  }, [profil?.etablissement_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profil?.etablissement_id) return;
    
    const toastId = toast.loading("Mise à jour de la configuration...");
    try {
      const docRef = doc(db, 'etablissements', profil.etablissement_id);
      await updateDoc(docRef, formData);
      toast.success("Configuration enregistrée avec succès.", { id: toastId });
    } catch {
      toast.error("Échec de la mise à jour.", { id: toastId });
    }
  };

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Chargement des données...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Settings size={14} />
              Paramètres Système
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Profil de l'<span className="text-[#FF7A00]">Établissement</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Définissez l'identité de votre commerce, vos coordonnées et vos préférences opérationnelles.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
            {/* Operational Identity */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-inner">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Identité Commerciale</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Informations publiques de votre enseigne</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Nom de l'Établissement</label>
                        <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Slogan ou Description</label>
                        <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A]/60 text-sm uppercase tracking-widest shadow-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Email de contact</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Téléphone de l'Établissement</label>
                        <input type="text" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm" />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Adresse Géographique</label>
                    <input type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})}
                      className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm" />
                </div>
            </div>

            {/* Protocol Metrics */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Configuration Digitale</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Horaires et visibilité en ligne</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Horaires d'Ouverture</label>
                        <input type="text" value={formData.horaires} onChange={e => setFormData({...formData, horaires: e.target.value})}
                          placeholder="Ex: Lun-Dim 08:00 - 02:00"
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm placeholder:text-slate-200" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Site Web / Réseaux Sociaux</label>
                        <input type="text" value={formData.siteWeb} onChange={e => setFormData({...formData, siteWeb: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm placeholder:text-slate-200" />
                    </div>
                </div>
            </div>

            {/* HR & Discipline Protocols */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Protocole RH & Discipline</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestion automatique des retards et sanctions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Heure de Prise de Poste Standard</label>
                        <input type="time" value={formData.heureOuvertureStandard} onChange={e => setFormData({...formData, heureOuvertureStandard: e.target.value})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Tolérance Acceptée (minutes)</label>
                        <input type="number" value={formData.toleranceRetard} onChange={e => setFormData({...formData, toleranceRetard: Number(e.target.value)})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm shadow-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Malus / Minute (XAF)</label>
                        <input type="number" value={formData.malusRetardParMinute} onChange={e => setFormData({...formData, malusRetardParMinute: Number(e.target.value)})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-rose-500 text-sm shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Seuil Répétitif (Retards/Mois)</label>
                        <input type="number" value={formData.seuilRetardRepetitif} onChange={e => setFormData({...formData, seuilRetardRepetitif: Number(e.target.value)})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Multiplicateur Récidive</label>
                        <input type="number" step="0.5" value={formData.multiplicateurMalusRepetitif} onChange={e => setFormData({...formData, multiplicateurMalusRepetitif: Number(e.target.value)})}
                          className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm shadow-sm" />
                    </div>
                </div>
            </div>

            {/* Establishment Type & Tax Config */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Configuration Fiscale & Type</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adaptez l'application à votre activité</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 px-1">Nature de l'Établissement</label>
                        <select 
                            value={formData.type_etablissement} 
                            onChange={e => setFormData({...formData, type_etablissement: e.target.value})}
                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-[#1E3A8A] text-sm uppercase tracking-widest shadow-sm"
                        >
                            <option value="bar_restaurant">🍹 Bar / Restaurant</option>
                            <option value="boutique">🛍️ Boutique / Divers</option>
                            <option value="mixte">🏪 Mixte (Boutique + Bar)</option>
                        </select>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-bold text-[#1E3A8A] uppercase leading-relaxed">
                            {formData.type_etablissement === 'boutique' 
                                ? "💡 Mode Boutique : L'interface caissier sera simplifiée pour les ventes directes sans gestion de tables."
                                : "💡 Mode Bar/Resto : Active la gestion des tables, du plan de salle et du KDS."}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {[
                        { label: 'TVA (%)', key: 'tva_taux' },
                        { label: 'Loisirs (%)', key: 'taxe_loisirs_taux' },
                        { label: 'Tourisme (%)', key: 'taxe_tourisme_taux' },
                        { label: 'CNSS (%)', key: 'cnss_taux' },
                        { label: 'IS (%)', key: 'is_taux' },
                    ].map((taxe) => (
                        <div key={taxe.key}>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">{taxe.label}</label>
                            <input 
                                type="number" 
                                value={(formData as any)[taxe.key]} 
                                onChange={e => setFormData({...formData, [taxe.key]: Number(e.target.value)})}
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 font-black text-[#1E3A8A] text-xs shadow-sm" 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* System Interconnect */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] shadow-inner">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight">Écosystème & POS</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Synchronisation des terminaux de paiement</p>
                    </div>
                </div>

                <div className="p-8 md:p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                    <p className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-widest mb-8 text-center">Terminaux connectés au Registre Live</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['INTERNE (GESTCAVE)', 'SQUARE', 'LIGHTSPEED', 'ZETTLE', 'SUMUP', 'CLOVER'].map((pos) => (
                            <button 
                                key={pos}
                                type="button"
                                className={`h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                    pos === 'INTERNE (GESTCAVE)' 
                                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-lg shadow-blue-900/20' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-[#1E3A8A] hover:text-[#1E3A8A]'
                                }`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                    <div className="mt-10 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        SYNCHRONISATION DES STOCKS AUTOMATISÉE
                    </div>
                </div>
            </div>
        </div>

        <aside className="space-y-8">
            {/* Visual Identification */}
            <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-10">Image de Marque</p>
                <div className="w-32 h-32 mx-auto bg-white/10 rounded-[2.5rem] border-4 border-white/10 flex items-center justify-center mb-10 shadow-inner relative z-10 group-hover:scale-105 transition-transform">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-cover rounded-[2rem]" />
                    ) : (
                        <Image size={48} className="text-white/20" />
                    )}
                </div>
                <div className="relative z-10 space-y-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block px-1">Lien du Logo (URL)</label>
                    <input 
                      type="text" 
                      value={formData.logo} 
                      onChange={e => setFormData({...formData, logo: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 h-14 px-6 rounded-xl text-[11px] font-bold outline-none text-white placeholder:text-white/10 focus:bg-white/10 transition-all"
                    />
                </div>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-8 leading-relaxed relative z-10">Branding officiel utilisé sur les factures et rapports PDF.</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-blue-900/5">
                <div className="flex items-center gap-4 mb-8">
                    <ShieldAlert size={24} className="text-orange-500" />
                    <h4 className="font-extrabold text-[#1E3A8A] text-xs uppercase tracking-tight">Accès Administrateur</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10">Seuls les comptes avec privilèges de gestionnaire peuvent modifier ces paramètres.</p>
                
                <button type="submit" className="w-full h-20 bg-[#FF7A00] text-white rounded-[2rem] font-bold uppercase tracking-widest text-sm shadow-2xl shadow-orange-900/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-4">
                    Sauvegarder <ArrowRight size={18} />
                </button>
            </div>
        </aside>
      </form>
    </div>
  );
};

export default GestionEtablissement;
