import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Key, Trash2, RefreshCw, 
  Copy, Info, ShieldCheck, Wallet, 
  Briefcase, Activity, X, ChevronRight, Check,
  Sparkles, ShieldAlert, Fingerprint, Search, MoreHorizontal,
  Calendar, CreditCard, ArrowRight, UserCheck, Shield, History as HistoryIcon,
  Eye, EyeOff
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { enregistrerAuditLog } from '../../lib/auditLogger';
import toast from 'react-hot-toast';

interface Employe {
  id: string;
  nom: string;
  role: 'serveur' | 'caissier' | 'cuisine' | 'gerant' | 'livreur' | 'securite' | 'admin';
  pin: string;
  salaire: number;
  typeSalaire: 'mensuel' | 'horaire' | 'journalier';
  primes?: {
    transport: number;
    logement: number;
    autres: number;
  };
  nbEnfants?: number;
  actif: boolean;
}

interface Avance {
  id: string;
  employe_id: string;
  montant: number;
  date: string;
  motif: string;
}

const GestionEmployes = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = (profil?.role === 'super_admin' && etablissementSimuleId) ? etablissementSimuleId : profil?.etablissement_id;
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinsVisibles, setPinsVisibles] = useState<Record<string, boolean>>({});
  
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauRole, setNouveauRole] = useState<'serveur' | 'caissier' | 'cuisine' | 'gerant' | 'livreur' | 'securite' | 'admin' | 'agent_nettoyage'>('serveur');
  const [typeSalaire, setTypeSalaire] = useState<'mensuel' | 'horaire' | 'journalier'>('mensuel');
  const [nouveauSalaire, setNouveauSalaire] = useState(0);
  const [primeTransport, setPrimeTransport] = useState(0);
  const [primeLogement, setPrimeLogement] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [montantAvance, setMontantAvance] = useState(0);
  const [motifAvance, setMotivAvance] = useState('');
  const [showAvanceModal, setShowAvanceModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [presents, setPresents] = useState<any[]>([]);
  const [sanctions, setSanctions] = useState<any[]>([]);

  useEffect(() => {
    if (!etablissementId) {
      setLoading(false);
      return;
    }

    const qPresence = query(
      collection(db, 'pointage_presence'),
      where('etablissement_id', '==', etablissementId),
      where('statut', 'in', ['present', 'pause'])
    );
    const unsubPresence = onSnapshot(
      qPresence, 
      (snap) => {
        setPresents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("pointage_presence error:", err.message)
    );

    const debutMois = new Date();
    debutMois.setDate(1); debutMois.setHours(0,0,0,0);

    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubTrans = onSnapshot(
      qTrans, 
      (snap) => {
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("transactions_pos error:", err.message)
    );

    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', etablissementId));
    const unsubEmp = onSnapshot(
      qEmp, 
      (snapshot) => {
        setEmployes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[]);
        setLoading(false);
      },
      (err) => {
        console.warn("employes error:", err.message);
        setLoading(false);
      }
    );

    const qAvances = query(
      collection(db, 'avances'), 
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', debutMois.toISOString())
    );

    const unsubAvances = onSnapshot(
      qAvances, 
      (snapshot) => {
        setAvances(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Avance[]);
      },
      (err) => console.warn("avances error:", err.message)
    );

    const qSanctions = query(
      collection(db, 'discipline'),
      where('etablissement_id', '==', etablissementId),
      where('date', '>=', debutMois.toISOString())
    );
    const unsubSanctions = onSnapshot(
      qSanctions, 
      (snapshot) => {
        setSanctions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("discipline error:", err.message)
    );

    return () => { unsubEmp(); unsubAvances(); unsubTrans(); unsubPresence(); unsubSanctions(); };
  }, [etablissementId]);

  const genererPIN = () => Math.floor(1000 + Math.random() * 9000).toString();

  const ajouterEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'employes'), {
        nom: nouveauNom, 
        role: nouveauRole, 
        pin: genererPIN(), 
        salaire: Number(nouveauSalaire),
        typeSalaire,
        primes: {
          transport: Number(primeTransport),
          logement: Number(primeLogement),
          autres: 0
        },
        actif: true, 
        etablissement_id: etablissementId, 
        dateCreation: new Date().toISOString()
      });
      toast.success("Employé ajouté avec succès");
      setNouveauNom(''); setNouveauSalaire(0); setPrimeTransport(0); setPrimeLogement(0); setShowModal(false);
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const enregistrerAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmploye || montantAvance <= 0) return;
    try {
      await addDoc(collection(db, 'avances'), {
        employe_id: selectedEmploye.id, employe_nom: selectedEmploye.nom,
        montant: Number(montantAvance), motif: motifAvance,
        date: new Date().toISOString(), etablissement_id: etablissementId
      });
      toast.success("Avance sur salaire enregistrée");
      setMontantAvance(0); setMotivAvance(''); setShowAvanceModal(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const enregistrerPaiement = async (emp: Employe, montant: number) => {
    if (!window.confirm(`Confirmer le paiement de ${montant.toLocaleString()} XAF à ${emp.nom.toUpperCase()} ?`)) return;
    
    try {
      await addDoc(collection(db, 'paiements_salaires'), {
        employe_id: emp.id,
        employe_nom: emp.nom,
        montant: Number(montant),
        date: new Date().toISOString(),
        etablissement_id: profil?.etablissement_id || '',
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear()
      });
      toast.success("Paiement enregistré");
    } catch {
      toast.error("Erreur lors du paiement");
    }
  };

  const supprimerEmploye = async (id: string, nom: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer l'accès de ${nom.toUpperCase()} ?`)) {
      try {
        await deleteDoc(doc(db, 'employes', id));
        toast.success("Compte supprimé");
      } catch { toast.error("Erreur suppression"); }
    }
  };

  const copierPIN = (pin: string, nom: string) => {
    navigator.clipboard.writeText(pin);
    toast.success(`Code PIN de ${nom.toUpperCase()} copié`);
  };

  const marquerAbsence = async (emp: Employe) => {
    const penaltyAmount = emp.typeSalaire === 'journalier' ? emp.salaire : 
                        emp.typeSalaire === 'mensuel' ? Math.floor(emp.salaire / 26) : 
                        emp.salaire * 8;

    if (!window.confirm(`Confirmer l'absence INJUSTIFIÉE de ${emp.nom.toUpperCase()} ?\n\nUne pénalité de ${penaltyAmount.toLocaleString()} XAF sera déduite de sa paie.`)) return;

    try {
      await addDoc(collection(db, 'discipline'), {
        employe_id: emp.id,
        employe_nom: emp.nom,
        type: 'absence_injustifiee',
        montant: penaltyAmount,
        date: new Date().toISOString(),
        etablissement_id: etablissementId,
        note: "Absence injustifiée constatée par la direction"
      });
      toast.success(`Absence enregistrée pour ${emp.nom}`);
    } catch {
      toast.error("Erreur lors de l'enregistrement de l'absence");
    }
  };

  const masseSalariale = employes.reduce((acc, curr) => acc + (curr.salaire || 0), 0);
  const totalAvancesMois = avances.reduce((acc, curr) => acc + (curr.montant || 0), 0);

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Chargement du personnel...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Users size={14} />
              Ressources Humaines
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Gestion du <span className="text-[#FF7A00]">Personnel</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Pilotez votre équipe, gérez les accès et automatisez la paie.</p>
        </div>

        <button onClick={() => setShowModal(true)} className="px-8 py-5 bg-[#1E3A8A] text-white rounded-2xl font-bold text-sm flex items-center gap-4 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10 relative z-10">
          <UserPlus size={20} /> Recruter un employé
        </button>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-6"><Briefcase size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Effectif Total</p>
            <p className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight">{employes.length}</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6"><Wallet size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Masse Salariale</p>
            <p className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight">{masseSalariale.toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-6"><HistoryIcon size={24} /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Avances (Mois)</p>
            <p className="text-4xl font-extrabold text-orange-500 tracking-tight">{totalAvancesMois.toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
          <div className="bg-[#1E3A8A] p-8 rounded-[2rem] shadow-xl shadow-blue-900/20 group hover:scale-[1.02] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6"><Activity size={24} /></div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Net à Payer</p>
            <p className="text-4xl font-extrabold text-white tracking-tight">{(masseSalariale - totalAvancesMois).toLocaleString()} <span className="text-sm font-bold opacity-30">XAF</span></p>
          </div>
      </div>

      <div className="bg-orange-50/50 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center border border-orange-100/50">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#FF7A00] shadow-sm shrink-0">
              <ShieldCheck size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
              <p className="font-bold text-[#1E3A8A] text-lg mb-1">Authentification Sécurisée</p>
              <p className="text-slate-500 text-sm">Les employés utilisent leur <span className="text-[#FF7A00] font-bold">Code PIN</span> unique pour pointer et accéder aux interfaces de vente.</p>
          </div>
          <button className="px-6 py-3 bg-white border border-orange-100 text-[#FF7A00] rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-orange-100 transition-all">
             Audit de Sécurité
          </button>
      </div>

      {/* Live Attendance */}
      {presents.length > 0 && (
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 p-10 space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex items-center gap-6 mb-4">
             <div className="w-2 h-8 bg-emerald-500 rounded-full" />
             <h3 className="text-xl font-extrabold text-[#1E3A8A] uppercase tracking-tight flex items-center gap-4">
               Personnel en poste <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs">{presents.length} actifs</span>
             </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {presents.map((p, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 transition-all hover:bg-emerald-50 group">
                 <div className={`w-3 h-3 rounded-full ${p.statut === 'pause' ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500 shadow-lg shadow-emerald-900/20'}`} />
                 <span className="text-sm font-bold text-[#1E3A8A] group-hover:text-emerald-700">{p.employe_nom}</span>
                 <div className="w-[1px] h-4 bg-slate-200" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   Depuis {new Date(p.debut.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                 </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employes.map((emp) => {
              const totalAvances = avances.filter(a => a.employe_id === emp.id).reduce((acc, curr) => acc + curr.montant, 0);
              const totalSanctions = sanctions.filter(s => s.employe_id === emp.id).reduce((acc, curr) => acc + curr.montant, 0);
              const ventesEmploye = transactions.filter(t => t.serveurId === emp.id).reduce((acc, t) => acc + (t.total || 0), 0);
              const commission = emp.role === 'serveur' ? Math.floor(ventesEmploye * 0.02) : 0;
              const soldeNet = (emp.salaire || 0) + commission - totalAvances - totalSanctions;

              return (
              <div key={emp.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 hover:border-blue-200 transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-30 group-hover:bg-blue-50 transition-colors" />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-[#1E3A8A] transition-colors"><HistoryIcon size={18} /></div>
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                    {emp.role === 'caissier' ? '💰' : 
                     emp.role === 'cuisine' ? '👨‍🍳' : 
                     emp.role === 'gerant' ? '💼' :
                     emp.role === 'livreur' ? '🛵' :
                     emp.role === 'securite' ? '👮' :
                     emp.role === 'admin' ? '🛡️' : '🤵'}
                  </div>
                  <div className="px-4 py-1.5 bg-blue-50 text-[#1E3A8A] rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {emp.role}
                  </div>
                </div>

                <div className="mb-8 relative z-10">
                    <h3 className="font-extrabold text-[#1E3A8A] text-2xl tracking-tight leading-none mb-4">{emp.nom}</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-slate-400">
                           <Fingerprint size={14} />
                           <span className="text-xs font-bold text-[#1E3A8A] tracking-[0.2em]">
                             {pinsVisibles[emp.id] ? emp.pin : '••••'}
                           </span>
                        </div>
                        <button 
                          onClick={() => {
                            const isRevealed = pinsVisibles[emp.id];
                            if (isRevealed) {
                              setPinsVisibles(prev => ({ ...prev, [emp.id]: false }));
                            } else {
                              setPinsVisibles(prev => ({ ...prev, [emp.id]: true }));
                              toast.success("PIN affiché (10s)");
                              enregistrerAuditLog({
                                etablissement_id: etablissementId || '',
                                auteur_id: profil?.id || 'admin',
                                auteur_nom: profil?.nom || 'Gérant',
                                auteur_role: profil?.role || 'client_admin',
                                type_action: 'MODIFICATION_PIN',
                                niveau: 'avertissement',
                                description: `Consultation de sécurité du code PIN de l'employé ${emp.nom}.`
                              });
                              setTimeout(() => {
                                setPinsVisibles(prev => ({ ...prev, [emp.id]: false }));
                              }, 10000);
                            }
                          }} 
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-xl transition-all"
                          title={pinsVisibles[emp.id] ? "Masquer le PIN" : "Révéler temporairement (10s)"}
                        >
                          {pinsVisibles[emp.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 border border-slate-100 shadow-inner relative z-10">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Salaire de Base</span>
                    <span className="text-[#1E3A8A]">
                        {emp.salaire?.toLocaleString()} <span className="text-[9px] opacity-40">XAF</span>
                    </span>
                  </div>
                  
                  {(emp.primes?.transport || 0) + (emp.primes?.logement || 0) > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-500 uppercase tracking-widest">
                        <span>Primes & Indemnités</span>
                        <span>+{( (emp.primes?.transport || 0) + (emp.primes?.logement || 0) ).toLocaleString()}</span>
                    </div>
                  )}

                  {commission > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-blue-500 uppercase tracking-widest">
                      <span>Commissions (2%)</span>
                      <span>+{commission.toLocaleString()}</span>
                    </div>
                  )}
                  {totalAvances > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-orange-500 uppercase tracking-widest">
                      <span>Avances à déduire</span>
                      <span>-{totalAvances.toLocaleString()}</span>
                    </div>
                  )}
                  {totalSanctions > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500 uppercase tracking-widest">
                      <span>Sanctions (Retards/Abs)</span>
                      <span>-{totalSanctions.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-slate-200/50 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net à payer</span>
                    <span className="text-[#1E3A8A] font-black text-2xl tracking-tighter">{soldeNet.toLocaleString()} <span className="text-xs opacity-20">XAF</span></span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
                    <button onClick={() => { setSelectedEmploye(emp); setShowAvanceModal(true); }}
                      className="h-14 bg-white border border-slate-200 text-[#1E3A8A] rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-slate-50"
                    >
                      Avance
                    </button>
                    <button onClick={() => marquerAbsence(emp)}
                      className="h-14 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-orange-100"
                    >
                      Absence
                    </button>
                    <button onClick={() => enregistrerPaiement(emp, soldeNet)}
                      className="col-span-2 h-16 bg-[#1E3A8A] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-blue-800 shadow-lg shadow-blue-900/10 mt-2"
                    >
                      Payer le solde net
                    </button>
                    <button onClick={() => supprimerEmploye(emp.id, emp.nom)} className="col-span-2 h-12 text-slate-300 hover:text-rose-500 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                       <Trash2 size={14} /> Supprimer l'accès
                    </button>
                </div>
              </div>
            )})}
      </div>

      {/* Recruitment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="w-full max-w-xl bg-white p-12 md:p-16 rounded-[3.5rem] relative shadow-2xl animate-in zoom-in-95 duration-500 border border-white/20">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                  Nouveau Recrutement
                </div>
                <h3 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight">Enrôler un employé</h3>
            </div>
            <form onSubmit={ajouterEmploye} className="space-y-8">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Identité Complète</label>
                <input type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} required placeholder="NOM ET PRÉNOM"
                  className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] placeholder:text-slate-200 shadow-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Poste & Responsabilités</label>
                <select value={nouveauRole} onChange={(e) => setNouveauRole(e.target.value as any)} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-bold text-[#1E3A8A] uppercase tracking-widest appearance-none shadow-sm">
                    <option value="serveur">🤵 Serveur / Salle</option>
                    <option value="caissier">💰 Caissier / Finance</option>
                    <option value="cuisine">👨‍🍳 Chef / Cuisine</option>
                    <option value="gerant">💼 Gérant / Direction</option>
                    <option value="livreur">🛵 Livreur</option>
                    <option value="securite">👮 Sécurité</option>
                    <option value="admin">🛡️ Administrateur</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Fréquence Paie</label>
                    <select value={typeSalaire} onChange={(e) => setTypeSalaire(e.target.value as any)} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none font-bold text-[#1E3A8A] text-xs uppercase tracking-widest appearance-none shadow-sm">
                        <option value="mensuel">Mensuel</option>
                        <option value="horaire">Horaire</option>
                        <option value="journalier">Journalier</option>
                    </select>
                </div>
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Montant Base (XAF)</label>
                    <input type="number" value={nouveauSalaire} onChange={(e) => setNouveauSalaire(Number(e.target.value))} required
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-black text-[#FF7A00] text-2xl tracking-tighter shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Prime Transport</label>
                    <input type="number" value={primeTransport} onChange={(e) => setPrimeTransport(Number(e.target.value))}
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-bold text-[#1E3A8A] shadow-sm" />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Indemnité Logement</label>
                    <input type="number" value={primeLogement} onChange={(e) => setPrimeLogement(Number(e.target.value))}
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-bold text-[#1E3A8A] shadow-sm" />
                </div>
              </div>

              <button type="submit" className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] text-sm font-bold uppercase tracking-widest hover:bg-blue-800 transition-all mt-6 shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-4">
                Confirmer l'enrôlement <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Credit Modal */}
      {showAvanceModal && selectedEmploye && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <div onClick={() => setShowAvanceModal(false)} className="absolute inset-0 bg-[#1E3A8A]/90 backdrop-blur-xl" />
          <div className="w-full max-w-xl bg-white p-12 md:p-16 rounded-[3.5rem] relative shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-6">
                  Acompte sur Salaire
                </div>
                <h3 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight">Autoriser une Avance</h3>
                <p className="text-slate-400 font-bold text-sm mt-4 uppercase tracking-widest">Bénéficiaire : <span className="text-[#1E3A8A]">{selectedEmploye.nom}</span></p>
            </div>
            <form onSubmit={enregistrerAvance} className="space-y-10">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 text-center">Montant de l'avance (XAF)</label>
                <input type="number" value={montantAvance} onChange={(e) => setMontantAvance(Number(e.target.value))} required autoFocus
                  className="w-full text-center text-6xl font-black text-orange-500 bg-transparent outline-none tracking-tighter" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3 px-1">Motif ou Commentaire</label>
                <input type="text" value={motifAvance} onChange={(e) => setMotivAvance(e.target.value)} placeholder="Justificatif court..."
                  className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 outline-none font-bold text-[#1E3A8A] shadow-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={() => setShowAvanceModal(false)} className="h-16 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Annuler</button>
                <button type="submit" className="h-16 bg-[#1E3A8A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20">Valider l'avance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEmployes;
