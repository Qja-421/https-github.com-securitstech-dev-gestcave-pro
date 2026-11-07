import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, AlertCircle, ShoppingBag, 
  Star, Wallet, Package, ClipboardList, Truck
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { aggregateFinancials, buildDailyFinancialSeries, type TransactionLike } from '../../lib/finance';
import { Link } from 'react-router-dom';

const DashboardAccueil = ({ isSolo = false }: { isSolo?: boolean }) => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  
  const [transactions, setTransactions] = useState<TransactionLike[]>([]);
  const [employesPresents, setEmployesPresents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!etablissementId) return;

    // Fetch transactions
    const qTrans = query(
      collection(db, 'transactions_pos'), 
      where('etablissement_id', '==', etablissementId)
    );
    const unsubTrans = onSnapshot(
      qTrans, 
      (snap) => {
        setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionLike)));
        setLoading(false);
      },
      (err) => {
        console.warn("transactions_pos inaccessible:", err.message);
        setLoading(false);
      }
    );

    // Fetch active employees
    const qPres = query(
      collection(db, 'pointage_presence'),
      where('etablissement_id', '==', etablissementId),
      where('statut', '==', 'present')
    );
    const unsubPres = onSnapshot(
      qPres, 
      (snap) => {
        setEmployesPresents(snap.docs.length);
      },
      (err) => {
        console.warn("pointage_presence inaccessible:", err.message);
        setEmployesPresents(5); // default mock
      }
    );

    return () => { unsubTrans(); unsubPres(); };
  }, [etablissementId]);

  const { encaisse, piecesVente, dettes } = useMemo(() => aggregateFinancials(transactions), [transactions]);
  const chartData = useMemo(() => buildDailyFinancialSeries(transactions, 7), [transactions]);

  const topProduits = [
    { nom: 'Heineken 65cl', qte: 145, CA: 145000 },
    { nom: 'Beaufort 65cl', qte: 98, CA: 88200 },
    { nom: 'Whisky Black Label', qte: 12, CA: 180000 },
    { nom: 'Poulet Braisé', qte: 45, CA: 135000 }
  ];

  if (loading) return null; // Handled by Suspense in parent

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="hero-banner flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Bonjour, {profil?.nom} 👋</h2>
          <p className="text-brand-primary-light/80 font-medium max-w-lg">
            {isSolo
              ? "Mode Solo: creez vos articles, approvisionnez le stock et saisissez directement les ventes du jour."
              : "Voici un aperçu de l'activité de votre établissement aujourd'hui. Tout est sous contrôle."}
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          {isSolo ? (
            <Link to="/tableau-de-bord?tab=saisie-journaliere" className="btn btn-accent btn-lg">
              <ClipboardList size={18} /> Saisie directe
            </Link>
          ) : (
            <Link to="/caisse-mode" className="btn btn-accent btn-lg">
              <ShoppingBag size={18} /> Ouvrir la Caisse
            </Link>
          )}
        </div>
      </div>

      {isSolo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SoloShortcut
            to="/tableau-de-bord?tab=stocks"
            icon={<Package size={24} />}
            title="Creer les articles"
            text="Boissons, nourriture, prix et seuils de stock."
          />
          <SoloShortcut
            to="/tableau-de-bord?tab=achats"
            icon={<Truck size={24} />}
            title="Acheter / approvisionner"
            text="Chaque achat augmente le stock disponible."
          />
          <SoloShortcut
            to="/tableau-de-bord?tab=saisie-journaliere"
            icon={<ClipboardList size={24} />}
            title="Saisie directe"
            text="Les ventes et pertes diminuent le stock."
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'Affaires" 
          value={encaisse.toLocaleString()} 
          suffix="XAF"
          icon={<Wallet size={24} />} 
          trend={12.5} 
          variant="primary" 
        />
        <StatCard 
          title="Ventes Réalisées" 
          value={piecesVente} 
          icon={<ShoppingBag size={24} />} 
          trend={5.2} 
          variant="default" 
        />
        {!isSolo && <StatCard
          title="Staff Présent" 
          value={employesPresents} 
          icon={<Users size={24} />} 
          variant="default" 
        />}
        <StatCard 
          title="Crédits Clients" 
          value={dettes.toLocaleString()} 
          suffix="XAF"
          icon={<AlertCircle size={24} />} 
          trend={-2.4} 
          variant="danger"
        />
      </div>

      {!isSolo && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8 relative overflow-hidden">
          <div className="section-header">
            <div>
              <h3 className="section-title flex items-center gap-2"><TrendingUp className="text-brand" /> Flux de Revenus</h3>
              <p className="section-subtitle">Évolution du CA sur les 7 derniers jours</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dx={-10} />
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: 'var(--shadow-xl)', padding: '16px'}}
                  cursor={{stroke: 'var(--brand-primary)', strokeWidth: 2, strokeDasharray: '4 4'}}
                />
                <Area type="monotone" dataKey="encaisse" name="CA Encassé" stroke="#1E3A8A" strokeWidth={4} fillOpacity={1} fill="url(#colorCA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-8">
          <div className="section-header">
            <div>
              <h3 className="section-title flex items-center gap-2"><Star className="text-accent" /> Top Produits</h3>
              <p className="section-subtitle">Meilleures ventes du jour</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            {topProduits.map((prod, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center font-bold text-text-muted group-hover:bg-brand-light group-hover:text-brand transition-colors">
                    #{i+1}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text-primary">{prod.nom}</p>
                    <p className="text-xs font-semibold text-text-muted">{prod.qte} ventes</p>
                  </div>
                </div>
                <p className="font-extrabold text-sm text-text-primary">{prod.CA.toLocaleString()} <span className="text-[10px] opacity-50">XAF</span></p>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-3 text-xs font-bold uppercase tracking-widest text-brand hover:bg-brand-light rounded-xl transition-colors">
            Voir le rapport détaillé
          </button>
        </div>
      </div>}
    </div>
  );
};

const SoloShortcut = ({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) => (
  <Link to={to} className="card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center mb-5">
      {icon}
    </div>
    <h3 className="font-black text-lg text-text-primary mb-2">{title}</h3>
    <p className="text-sm font-medium text-text-muted leading-6">{text}</p>
  </Link>
);

export default DashboardAccueil;
