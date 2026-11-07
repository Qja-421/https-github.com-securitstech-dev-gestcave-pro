import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Calendar, Download, Users, 
  ArrowUpRight, ArrowDownRight, Printer, 
  Search, Filter, ChevronRight, CheckCircle2,
  AlertCircle, Briefcase, Clock, MapPin, Home,
  FileText, Percent, Sparkles, Activity, Landmark,
  ArrowRight, TrendingUp, Info
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employe {
  id: string;
  nom: string;
  role: string;
  salaire: number;
  typeSalaire: 'mensuel' | 'horaire' | 'journalier';
  primes?: { transport: number; logement: number; autres: number; };
}

interface SessionTravail {
  id: string;
  employe_id: string;
  debut: string;
  fin: string | null;
  poste: string;
}

interface Avance {
  employe_id: string;
  montant: number;
  date: string;
}

const GestionPaie = () => {
  const { profil } = useAuthStore();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [sessions, setSessions] = useState<SessionTravail[]>([]);
  const [avances, setAvances] = useState<Avance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [etablissementNom, setEtablissementNom] = useState('Mon Établissement');
  const [malus, setMalus] = useState<any[]>([]); // Pour les absences injustifiées
  const [loading, setLoading] = useState(true);
  
  const [moisSelectionne, setMoisSelectionne] = useState(new Date().getMonth() + 1);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!profil?.etablissement_id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const debutMois = new Date(anneeSelectionnee, moisSelectionne - 1, 1);
    const finMois = new Date(anneeSelectionnee, moisSelectionne, 0, 23, 59, 59);

    const chargerEtablissement = async () => {
      try {
        const docRef = doc(db, 'etablissements', profil.etablissement_id!);
        const snap = await getDoc(docRef);
        if (snap.exists()) setEtablissementNom(snap.data().nom || 'Mon Établissement');
      } catch (e) {
        console.error("Erreur chargement établissement:", e);
      }
    };
    chargerEtablissement();

    let ready = { emp: false, sessions: false, avances: false, trans: false };
    const checkReady = () => {
      if (ready.emp && ready.sessions && ready.avances && ready.trans) {
        setLoading(false);
      }
    };

    const qEmp = query(collection(db, 'employes'), where('etablissement_id', '==', profil.etablissement_id));
    const unsubEmp = onSnapshot(
      qEmp, 
      (snap) => {
        setEmployes(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Employe[]);
        ready.emp = true; checkReady();
      },
      (err) => { console.warn("employes error:", err.message); ready.emp = true; checkReady(); }
    );

    const qSessions = query(
      collection(db, 'pointage_presence'), 
      where('etablissement_id', '==', profil.etablissement_id),
      where('debut', '>=', Timestamp.fromDate(debutMois)),
      where('debut', '<=', Timestamp.fromDate(finMois))
    );
    const unsubSessions = onSnapshot(
      qSessions, 
      (snap) => {
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionTravail[]);
        ready.sessions = true; checkReady();
      },
      (err) => { console.warn("pointage_presence error:", err.message); ready.sessions = true; checkReady(); }
    );

    const qAvances = query(
      collection(db, 'avances'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString()),
      where('date', '<=', finMois.toISOString())
    );
    const unsubAvances = onSnapshot(
      qAvances, 
      (snap) => {
        setAvances(snap.docs.map(d => d.data()) as Avance[]);
        ready.avances = true; checkReady();
      },
      (err) => { console.warn("avances error:", err.message); ready.avances = true; checkReady(); }
    );

    const qTrans = query(
      collection(db, 'transactions_pos'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString()),
      where('date', '<=', finMois.toISOString())
    );
    const unsubTrans = onSnapshot(
      qTrans, 
      (snap) => {
        setTransactions(snap.docs.map(d => d.data()));
        ready.trans = true; checkReady();
      },
      (err) => { console.warn("transactions_pos error:", err.message); ready.trans = true; checkReady(); }
    );

    const qMalus = query(
      collection(db, 'discipline'),
      where('etablissement_id', '==', profil.etablissement_id),
      where('date', '>=', debutMois.toISOString()),
      where('date', '<=', finMois.toISOString())
    );
    const unsubMalus = onSnapshot(
      qMalus, 
      (snap) => {
        setMalus(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("discipline error:", err.message)
    );

    const timeout = setTimeout(() => { setLoading(false); }, 5000);

    return () => { 
      unsubEmp(); unsubSessions(); unsubAvances(); unsubTrans(); unsubMalus();
      clearTimeout(timeout);
    };
  }, [profil?.etablissement_id, moisSelectionne, anneeSelectionnee]);

  const calculerBulletin = (emp: Employe) => {
    const sessionsEmp = sessions.filter(s => s.employe_id === emp.id);
    const avancesEmp = avances.filter(a => a.employe_id === emp.id).reduce((acc, a) => acc + a.montant, 0);
    const ventesEmp = transactions.filter(t => t.serveurId === emp.id).reduce((acc, t) => acc + (t.total || 0), 0);
    const commission = emp.role === 'serveur' ? Math.floor(ventesEmp * 0.02) : 0;

    let salaireBase = 0;
    let presence = 0;

    if (emp.typeSalaire === 'mensuel') {
      salaireBase = emp.salaire || 0;
      presence = sessionsEmp.length > 0 ? 1 : 0; 
    } else if (emp.typeSalaire === 'journalier') {
      const joursUniques = new Set(sessionsEmp.map(s => {
        const d = (s as any).debut as Timestamp;
        return new Date(d.toMillis()).toISOString().split('T')[0];
      }));
      presence = joursUniques.size;
      salaireBase = presence * (emp.salaire || 0);
    } else if (emp.typeSalaire === 'horaire') {
      let totalMinutes = 0;
      sessionsEmp.forEach((s: any) => {
        if (s.debut && s.fin) {
          let diffMs = (s.fin as Timestamp).toMillis() - (s.debut as Timestamp).toMillis();
          if (s.pauses && Array.isArray(s.pauses)) {
            s.pauses.forEach((p: any) => {
              if (p.debut && p.fin) diffMs -= (p.fin as Timestamp).toMillis() - (p.debut as Timestamp).toMillis();
            });
          }
          totalMinutes += diffMs / 60000;
        }
      });
      presence = Math.round((totalMinutes / 60) * 10) / 10;
      salaireBase = Math.floor(presence * (emp.salaire || 0));
    }

    const malusEmp = malus.filter(m => m.employe_id === emp.id).reduce((acc, m) => acc + (m.montant || 0), 0);
    const absencesInjustifiees = malus.filter(m => m.employe_id === emp.id && m.type === 'absence_injustifiee').length;

    const primesTransport = emp.primes?.transport || 0;
    const primesLogement = emp.primes?.logement || 0;
    const brut = salaireBase + primesTransport + primesLogement + commission;
    const net = brut - avancesEmp - malusEmp;

    return { salaireBase, presence, commission, primesTransport, primesLogement, brut, avances: avancesEmp, malus: malusEmp, absencesInjustifiees, net };
  };

  const genererBulletinPDF = (emp: Employe) => {
    const { salaireBase, presence, commission, primesTransport, primesLogement, brut, avances, malus: malusTotal, absencesInjustifiees, net } = calculerBulletin(emp);
    const doc = new jsPDF();
    const dateStr = `${moisSelectionne}/${anneeSelectionnee}`;

    // Nettoyage des montants pour éviter les caractères spéciaux invisibles (ex: espace insécable)
    const fmtPDF = (n: number) => n.toLocaleString('fr-FR').replace(/\u00a0/g, ' ') + " XAF";

    doc.setFontSize(22); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138); 
    doc.text("GESTCAVE PRO", 14, 20);

    doc.setFontSize(10); 
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); 
    doc.text(`CERTIFICAT DE RÉMUNÉRATION - ${dateStr}`, 14, 28);
    
    doc.setDrawColor(30, 58, 138); 
    doc.setLineWidth(1); 
    doc.line(14, 35, 196, 35);

    doc.setFontSize(9); 
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold'); 
    doc.text("IDENTITÉ DE L'EMPLOYÉ", 14, 45);
    doc.setFont('helvetica', 'normal'); 
    doc.text(`${emp.nom.toUpperCase()}`, 14, 52);
    doc.text(`POSTE: ${emp.role.toUpperCase()}`, 14, 58);
    doc.text(`ID: ${emp.id.toUpperCase()}`, 14, 64);

    doc.setFont('helvetica', 'bold'); 
    doc.text("ÉTABLISSEMENT", 120, 45);
    doc.setFont('helvetica', 'normal'); 
    doc.text(`${etablissementNom.toUpperCase()}`, 120, 52);
    doc.text(`PÉRIODE: ${dateStr}`, 120, 58);

    autoTable(doc, {
      startY: 80,
      head: [['DÉSIGNATION', 'VOLUME / QTÉ', 'TAUX / ÉCHELLE', 'GAINS', 'RETENUES']],
      body: [
        ['RÉMUNÉRATION DE BASE', `${presence} ${emp.typeSalaire === 'horaire' ? 'H' : 'J'}`, fmtPDF(emp.salaire), fmtPDF(salaireBase), '-'],
        ['INDEMNITÉ TRANSPORT', '-', '-', fmtPDF(primesTransport), '-'],
        ['INDEMNITÉ LOGEMENT', '-', '-', fmtPDF(primesLogement), '-'],
        ['COMMISSION SUR VENTES (2%)', '-', '-', fmtPDF(commission), '-'],
        ['AVANCES / ACOMPTES', '-', '-', '-', fmtPDF(avances)],
        ['PÉNALITÉS DISCIPLINAIRES', `${absencesInjustifiees} ABS.`, '-', '-', fmtPDF(malusTotal)],
      ],
      headStyles: { fillColor: [30, 58, 138], fontSize: 8, font: 'helvetica', fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, font: 'helvetica' },
      foot: [['TOTAL GÉNÉRAL', '', '', fmtPDF(brut), fmtPDF(avances)]],
      footStyles: { fillColor: [248, 250, 252], textColor: [30, 58, 138], fontStyle: 'bold', font: 'helvetica' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(30, 58, 138); 
    doc.rect(120, finalY, 76, 18, 'F');
    doc.setFontSize(14); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(255, 255, 255);
    doc.text(`NET À PAYER :`, 125, finalY + 8);
    doc.setFontSize(12); 
    doc.text(fmtPDF(net), 125, finalY + 15);

    doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text("SIGNATURE EMPLOYEUR", 40, finalY + 45);
    doc.text("SIGNATURE EMPLOYÉ", 140, finalY + 45);

    doc.save(`Bulletin_Paie_${emp.nom.replace(' ', '_')}_${dateStr}.pdf`);
    toast.success(`Bulletin certifié pour ${emp.nom.toUpperCase()}`);
  };

  const masseSalarialeTotale = employes.reduce((acc, emp) => acc + calculerBulletin(emp).net, 0);

  if (loading) return <div className="p-40 text-center font-bold text-[#1E3A8A] uppercase tracking-widest animate-pulse">Compilation des salaires...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 relative overflow-hidden border border-slate-100 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-[#1E3A8A] text-xs font-bold uppercase tracking-widest mb-6">
              <Landmark size={14} />
              Ressources Humaines
           </div>
           <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E3A8A] tracking-tight leading-tight mb-4">
              Gestion des <span className="text-[#FF7A00]">Salaires</span>
           </h1>
           <p className="text-slate-500 font-medium text-lg max-w-md">Contrôlez la masse salariale, calculez les commissions et éditez les bulletins de paie.</p>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 relative z-10 shadow-sm">
            <select 
              value={moisSelectionne} 
              onChange={(e) => setMoisSelectionne(Number(e.target.value))}
              className="bg-white border-none outline-none font-bold text-[10px] uppercase tracking-widest px-6 py-4 text-[#1E3A8A] rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'}).toUpperCase()}</option>
              ))}
            </select>
            <select 
              value={anneeSelectionnee} 
              onChange={(e) => setAnneeSelectionnee(Number(e.target.value))}
              className="bg-white border-none outline-none font-bold text-[10px] uppercase tracking-widest px-6 py-4 text-[#1E3A8A] rounded-xl shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1E3A8A] p-10 rounded-[3rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-6 px-1">Masse salariale estimée</p>
            <p className="text-5xl font-black text-orange-400 tracking-tighter">{masseSalarialeTotale.toLocaleString()} <span className="text-sm font-bold opacity-30 text-white uppercase">XAF</span></p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-6 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-fit">CYCLE {new Date(0, moisSelectionne-1).toLocaleString('fr-FR', {month: 'long'}).toUpperCase()}</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-8 shadow-inner group-hover:bg-blue-100 transition-colors">
                <Users size={24} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Certificats Actifs</p>
            <p className="text-5xl font-black text-[#1E3A8A] tracking-tighter">{employes.length}</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-blue-900/5 group hover:scale-[1.02] transition-all">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-8 shadow-inner group-hover:bg-orange-100 transition-colors">
                <Activity size={24} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Pointages validés</p>
            <p className="text-5xl font-black text-[#1E3A8A] tracking-tighter">{sessions.length}</p>
          </div>
      </div>

      <div className="space-y-6">
          {employes.map(emp => {
            const data = calculerBulletin(emp);
            return (
              <div 
                key={emp.id}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 hover:border-blue-200 transition-all group shadow-xl shadow-blue-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-[#1E3A8A]/10 group-hover:bg-[#1E3A8A] transition-colors" />
                
                <div className="flex items-center gap-8 w-full lg:w-auto">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                        {emp.role === 'serveur' ? '🤵' : emp.role === 'caissier' ? '💰' : '👨‍🍳'}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-[#1E3A8A] uppercase tracking-tight text-2xl leading-none mb-3">{emp.nom}</h3>
                        <div className="flex gap-2">
                           <span className="text-[9px] font-bold bg-blue-50 text-[#1E3A8A] px-3 py-1.5 rounded-lg tracking-widest uppercase border border-blue-100">{emp.role}</span>
                           <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg tracking-widest uppercase border border-slate-100">{emp.typeSalaire}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full px-4 md:px-0">
                    <div className="relative">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Volume travail</p>
                        <p className="font-black text-[#1E3A8A] text-xl">
                          {data.presence} {emp.typeSalaire === 'horaire' ? 'H' : 'J'}
                        </p>
                    </div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gain Brut</p>
                        <p className="font-black text-[#1E3A8A] text-xl">+{data.brut.toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>
                    </div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Retenues</p>
                        <p className="font-black text-rose-500 text-xl">-{data.avances.toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>
                    </div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Discipline</p>
                        <p className={`font-black text-xl ${data.absencesInjustifiees > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {data.absencesInjustifiees} ABS.
                        </p>
                    </div>
                    <div className="relative">
                        <p className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest mb-2">Net à Payer</p>
                        <p className="font-black text-[#1E3A8A] text-3xl tracking-tighter">{data.net.toLocaleString()} <span className="text-[10px] opacity-30">F</span></p>
                    </div>
                </div>

                <button 
                  onClick={() => genererBulletinPDF(emp)}
                  className="w-full lg:w-auto px-8 h-16 bg-[#1E3A8A] text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 active:scale-95 group/btn"
                >
                  <Printer size={18} className="group-hover/btn:scale-110 transition-transform" /> Imprimer
                </button>
              </div>
            );
          })}

          {employes.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Users size={64} className="mx-auto text-slate-100 mb-8" />
                <p className="text-slate-300 font-bold uppercase tracking-[0.4em] text-xs">Aucun employé identifié dans le registre.</p>
            </div>
          )}
      </div>

      <div className="bg-[#1E3A8A] p-12 md:p-16 rounded-[3.5rem] text-white flex flex-col lg:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
          
          <div className="flex-1 space-y-6 relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-orange-400 mb-8 border border-white/10 shadow-inner">
                  <TrendingUp size={32} />
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter">Optimisation des Charges</h3>
              <p className="text-blue-100/70 text-lg font-medium leading-relaxed max-w-3xl">
                  Le calcul des commissions sur les ventes de 2% stimule la performance de vos serveurs. 
                  Toutes les rémunérations sont validées par le pointage PIN sécurisé pour une transparence totale.
              </p>
          </div>
          <div className="shrink-0 relative z-10">
              <button className="px-10 h-16 bg-white text-[#1E3A8A] rounded-[1.5rem] font-bold uppercase tracking-widest text-xs hover:bg-orange-500 hover:text-white transition-all shadow-2xl flex items-center gap-3">
                  <FileText size={18} /> Rapports Détaillés
              </button>
          </div>
      </div>
    </div>
  );
};

export default GestionPaie;
