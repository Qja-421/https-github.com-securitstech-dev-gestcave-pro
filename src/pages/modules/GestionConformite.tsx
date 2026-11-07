import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Calculator, Landmark, ArrowRight, X, Download,
  AlertCircle, History, Receipt, Search, RefreshCcw,
  Scale, Building2, Gavel, FileWarning, ClipboardCheck, MapPin, Users
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Taxe {
  id: string;
  nom: string;
  description: string;
  montant: number;
  frequence: 'annuel' | 'trimestriel' | 'mensuel' | 'unique';
  entite: string;
  paye: boolean;
  datePaiement?: string;
  echeance?: string;
  negociable: boolean;
}

interface DocumentConformite {
  nom: string;
  present: boolean;
  notes?: string;
}

const DEPARTEMENTS_CONGO = [
  "Pointe-Noire",
  "Brazzaville",
  "Kouilou",
  "Niari",
  "Lékoumou",
  "Bouenza",
  "Pool",
  "Plateaux",
  "Cuvette",
  "Cuvette-Ouest",
  "Sangha",
  "Likouala"
];

const GestionConformite = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [departement, setDepartement] = useState(profil?.departement || 'Pointe-Noire');
  const [nbChaises, setNbChaises] = useState(profil?.nb_chaises || 0);
  const [typeEtablissement, setTypeEtablissement] = useState<'restaurant' | 'bar' | 'mixte' | 'boutique'>(profil?.type_etablissement || 'mixte');
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editingMontant, setEditingMontant] = useState<number>(0);
  const [documents, setDocuments] = useState<DocumentConformite[]>([
    { nom: "Autorisation d'Exploitation", present: false },
    { nom: "Licence de Vente d'Alcool", present: false },
    { nom: "Registre de Commerce (RCCM)", present: false },
    { nom: "Agrément Technique (Tourisme/Loisirs)", present: false },
    { nom: "Certificat d'Hygiène & Salubrité", present: false },
    { nom: "Patente de l'année en cours", present: false },
    { nom: "Attestation BCDA", present: false }
  ]);

  useEffect(() => {
    if (!etablissementId) return;
    
    const q = query(collection(db, 'taxes_conformite'), where('etablissement_id', '==', etablissementId));
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Taxe[];
        setTaxes(data);
        setLoading(false);
      },
      (err) => {
        console.warn("taxes_conformite listener error:", err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [etablissementId]);

  const initialiserTaxesStandard = async () => {
    if (!window.confirm("Générer la liste des taxes ? Vous devrez ensuite saisir les montants négociés avec chaque entité.")) return;
    
    const taxesStandards = [
      {
        nom: "Autorisation d'Exploitation",
        description: `Capacité: ${nbChaises} chaises. Tutelle: ${typeEtablissement === 'restaurant' ? 'Tourisme' : 'Loisirs'}`,
        montant: 0,
        frequence: 'annuel',
        entite: typeEtablissement === 'restaurant' ? 'Dir. Dépt. Tourisme' : 'Dir. Dépt. Loisirs',
        negociable: true,
        paye: false
      },
      {
        nom: "Licence de Vente d'Alcool",
        description: "Services Préfectoraux — Montant à définir",
        montant: 0,
        frequence: 'unique',
        entite: "Préfecture",
        negociable: true,
        paye: false
      },
      {
        nom: "Droits d'Auteurs (BCDA)",
        description: "Redevance musique — payable trimestriellement",
        montant: 0,
        frequence: 'annuel',
        entite: "BCDA",
        negociable: true,
        paye: false
      },
      {
        nom: "Autorisation d'Ouverture (Mairie)",
        description: "Taxe municipale — Montant à négocier",
        montant: 0,
        frequence: 'annuel',
        entite: "Mairie",
        negociable: true,
        paye: false
      },
      {
        nom: "Impôts (Forfait Fiscal)",
        description: "Forfait fiscal — Montant à définir avec les Impôts",
        montant: 0,
        frequence: 'trimestriel',
        entite: "Impôts",
        negociable: true,
        paye: false
      }
    ];

    try {
      for (const t of taxesStandards) {
        await addDoc(collection(db, 'taxes_conformite'), {
          ...t,
          etablissement_id: etablissementId,
          departement,
          dateCreation: new Date().toISOString()
        });
      }
      toast.success("Taxes créées ! Saisissez maintenant les montants négociés.");
    } catch {
      toast.error("Erreur lors de l'initialisation");
    }
  };

  const updateMontantTaxe = async (taxeId: string, nouveauMontant: number) => {
    try {
      await updateDoc(doc(db, 'taxes_conformite', taxeId), { montant: nouveauMontant });
      toast.success("Montant mis à jour");
      setEditingTaxId(null);
    } catch {
      toast.error("Erreur de sauvegarde");
    }
  };

  const marquerCommePaye = async (id: string) => {
    try {
      await updateDoc(doc(db, 'taxes_conformite', id), {
        paye: true,
        datePaiement: new Date().toISOString()
      });
      toast.success("Taxe marquée comme payée");
    } catch {
      toast.error("Erreur système");
    }
  };

  const supprimerTaxe = async (id: string) => {
    if (!window.confirm("Supprimer cet élément ?")) return;
    try {
      await deleteDoc(doc(db, 'taxes_conformite', id));
      toast.success("Supprimé");
    } catch {
      toast.error("Erreur");
    }
  };

  const totalPaye = taxes.filter(t => t.paye).reduce((acc, t) => acc + t.montant, 0);
  const totalRestant = taxes.filter(t => !t.paye).reduce((acc, t) => acc + t.montant, 0);

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Chargement du module conformité...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Scale size={14} />
              Conformité Étatique & Fiscale
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Gestion des <span className="text-[#FF7A00]">Taxes</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Pilotez vos obligations administratives et évitez les pénalités de contrôle.</p>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
            <button onClick={initialiserTaxesStandard} className="px-6 py-4 bg-white border border-slate-200 text-[#1E3A8A] rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCcw size={18} /> Générer la Liste des Taxes
            </button>
            <button className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
              <ClipboardCheck size={18} /> Nouveau Contrôle
            </button>
        </div>
      </header>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
            <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2">
                <MapPin size={18} className="text-[#FF7A00]" /> Emplacement
            </h3>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Département d'implantation</label>
                <select 
                    value={departement}
                    onChange={(e) => setDepartement(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-[#1E3A8A] outline-none"
                >
                    {DEPARTEMENTS_CONGO.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
            <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2">
                <Users size={18} className="text-[#FF7A00]" /> Capacité d'accueil
            </h3>
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nombre de chaises / places</label>
                <input 
                    type="number"
                    value={nbChaises}
                    onChange={(e) => setNbChaises(Number(e.target.value))}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-[#1E3A8A] outline-none"
                />
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
            <h3 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest flex items-center gap-2">
                <Building2 size={18} className="text-[#FF7A00]" /> Type d'Entité
            </h3>
            <div className="flex gap-2">
                {(['restaurant', 'bar', 'mixte', 'boutique'] as const).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTypeEtablissement(t)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${typeEtablissement === t ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/10' : 'bg-slate-50 text-slate-400'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-6"><ShieldCheck size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Payé</p>
            <p className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">{totalPaye.toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6"><FileWarning size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reste à Payer</p>
            <p className="text-3xl font-extrabold text-rose-500 tracking-tight">{totalRestant.toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-6"><Landmark size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tutelle Principale</p>
            <p className="text-xl font-extrabold text-[#1E3A8A] tracking-tight truncate">{typeEtablissement === 'restaurant' ? 'Tourisme' : 'Loisirs'}</p>
          </div>
          <div className="bg-[#1E3A8A] p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FF7A00] mb-6"><Gavel size={24} /></div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Risque Juridique</p>
            <p className="text-2xl font-extrabold text-white tracking-tight">{totalRestant > 500000 ? 'ÉLEVÉ' : totalRestant > 0 ? 'MODÉRÉ' : 'NUL'}</p>
          </div>
      </div>

      {/* Taxes Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight">Registre des Taxes & Autorisations</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Département de {departement}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                <Search size={18} className="text-slate-300" />
                <input type="text" placeholder="Rechercher une taxe..." className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest w-64 text-[#1E3A8A]" />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400">
                    <tr>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Désignation</th>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Entité / Tutelle</th>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-center">Négociable</th>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Montant</th>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest">Statut</th>
                        <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {taxes.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-10 py-8">
                                <div>
                                    <p className="font-bold text-[#1E3A8A] text-sm uppercase">{t.nom}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">{t.description}</p>
                                </div>
                            </td>
                            <td className="px-10 py-8">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
                                    {t.entite}
                                </span>
                            </td>
                            <td className="px-10 py-8 text-center">
                                {t.negociable ? (
                                    <span className="text-emerald-500 text-[10px] font-black uppercase bg-emerald-50 px-2 py-1 rounded">Oui</span>
                                ) : (
                                    <span className="text-slate-300 text-[10px] font-black uppercase">Fixe</span>
                                )}
                            </td>
                            <td className="px-10 py-8">
                                {editingTaxId === t.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={editingMontant}
                                      onChange={(e) => setEditingMontant(Number(e.target.value))}
                                      className="w-32 h-10 bg-blue-50 border-2 border-[#1E3A8A] rounded-xl px-3 font-black text-[#1E3A8A] outline-none text-sm"
                                      autoFocus
                                      onKeyDown={(e) => { if (e.key === 'Enter') updateMontantTaxe(t.id, editingMontant); if (e.key === 'Escape') setEditingTaxId(null); }}
                                    />
                                    <button onClick={() => updateMontantTaxe(t.id, editingMontant)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><ClipboardCheck size={14} /></button>
                                    <button onClick={() => setEditingTaxId(null)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setEditingTaxId(t.id); setEditingMontant(t.montant); }}
                                    className="text-left group/montant cursor-pointer hover:bg-blue-50 px-3 py-2 -mx-3 rounded-xl transition-all"
                                    title="Cliquer pour modifier le montant négocié"
                                  >
                                    <p className={`font-black text-lg tracking-tight ${t.montant === 0 ? 'text-[#FF7A00] animate-pulse' : 'text-[#1E3A8A]'}`}>
                                      {t.montant === 0 ? 'À DÉFINIR' : `${t.montant.toLocaleString()} XAF`}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 group-hover/montant:text-[#FF7A00] transition-colors">
                                      {t.montant === 0 ? '✏️ Cliquer pour saisir' : `${t.frequence} · ✏️ modifier`}
                                    </p>
                                  </button>
                                )}
                            
                            </td>
                            <td className="px-10 py-8">
                                {t.paye ? (
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <ShieldCheck size={16} />
                                        <span className="text-[10px] font-black uppercase">À jour</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">En attente</span>
                                    </div>
                                )}
                            </td>
                            <td className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-2">
                                    {!t.paye && (
                                        <button 
                                            onClick={() => marquerCommePaye(t.id)}
                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <ClipboardCheck size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => supprimerTaxe(t.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {taxes.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-10 py-32 text-center">
                                <Landmark size={48} className="text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Aucune taxe enregistrée pour cet établissement.</p>
                                <button onClick={initialiserTaxesStandard} className="mt-6 text-[#FF7A00] font-black text-xs uppercase underline underline-offset-4">Initialiser maintenant</button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Documents & Inspections Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5">
            <h3 className="text-xl font-black text-[#1E3A8A] uppercase tracking-tight mb-8 flex items-center gap-4">
                <ClipboardCheck size={24} className="text-[#FF7A00]" />
                Checklist Documents (Commerce)
            </h3>
            <div className="space-y-4">
                {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-600">{doc.nom}</span>
                        <button 
                            onClick={() => {
                                const newDocs = [...documents];
                                newDocs[i].present = !newDocs[i].present;
                                setDocuments(newDocs);
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${doc.present ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-400'}`}
                        >
                            {doc.present ? 'Présent' : 'Manquant'}
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-[#0F172A] p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-4 relative z-10">
                <Gavel size={24} className="text-[#FF7A00]" />
                Rappel des Tutelles (Congo)
            </h3>
            <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[#FF7A00] font-black text-xs uppercase tracking-widest mb-2">Direction des Loisirs</p>
                    <p className="text-blue-100/60 text-sm leading-relaxed">
                        Gère uniquement les <strong>Bars, Caves, Snack-Bars, VIP et Boîtes de Nuit</strong>. L'autorisation est définie par le nombre de chaises.
                    </p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[#FF7A00] font-black text-xs uppercase tracking-widest mb-2">Direction du Tourisme</p>
                    <p className="text-blue-100/60 text-sm leading-relaxed">
                        Gère les <strong>Restaurants</strong> (peu importe la vente d'alcool). Dépend de la Direction Départementale (ex: Pointe-Noire).
                    </p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-rose-400 font-black text-xs uppercase tracking-widest mb-2">Impôts & BCDA</p>
                    <p className="text-blue-100/60 text-sm leading-relaxed">
                        Les droits d'auteurs sont annuels mais payables <strong>trimestriellement</strong>. Les impôts procèdent souvent par forfait.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Warning Section */}
      <div className="bg-rose-50 border-2 border-rose-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-rose-900/5">
        <div className="w-24 h-24 bg-rose-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-rose-200 shrink-0">
            <FileWarning size={48} />
        </div>
        <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight">Vérification de Conformité (Commerce)</h3>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
                Le service du commerce effectue des vérifications régulières. Assurez-vous d'avoir les originaux de tous vos documents requis (Licence, Autorisation, Registre de Commerce) présents physiquement dans l'établissement pour éviter des pénalités immédiates.
            </p>
        </div>
        <button className="h-16 px-10 bg-[#1E3A8A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-800 transition-all whitespace-nowrap shadow-xl shadow-blue-900/20">
            Liste des documents requis
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default GestionConformite;
