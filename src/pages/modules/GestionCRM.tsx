import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Mail, MapPin, Calendar, Star, TrendingUp, History, UserCheck, Smartphone } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';

export default function GestionCRM() {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!etablissementId) return;

    // Fetch transactions to aggregate client data
    const q = query(
      collection(db, 'transactions_pos'), 
      where('etablissement_id', '==', etablissementId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const clientMap = new Map();
      
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (!data.clientNom) return;
        
        const nom = data.clientNom.toUpperCase();
        const contact = data.clientContact || 'Non renseigné';
        const total = data.total || data.totalVente || 0;
        const restant = data.montantRestant || 0;
        
        if (!clientMap.has(nom)) {
          clientMap.set(nom, {
            id: nom,
            nom,
            contact,
            totalVisites: 1,
            totalAchat: total,
            dette: restant,
            derniereVisite: data.date
          });
        } else {
          const c = clientMap.get(nom);
          c.totalVisites += 1;
          c.totalAchat += total;
          c.dette += restant;
          if (new Date(data.date) > new Date(c.derniereVisite)) {
            c.derniereVisite = data.date;
          }
        }
      });
      
      setClients(Array.from(clientMap.values()).sort((a, b) => b.totalAchat - a.totalAchat));
      setLoading(false);
    }, (err) => {
      console.warn("CRM listener error:", err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [etablissementId]);

  if (loading) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="hero-banner flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
            <UserCheck size={14} /> CRM & Fidélité
          </div>
          <h2 className="text-4xl font-black mb-2 tracking-tight">Base Clients</h2>
          <p className="text-white/80 font-medium max-w-lg">
            Gérez vos relations clients, identifiez vos VIP et suivez les historiques de consommation.
          </p>
        </div>
      </div>

      <div className="card p-8">
        <div className="section-header mb-8">
          <div>
            <h3 className="section-title">Répertoire Clients</h3>
            <p className="section-subtitle">Top clients classés par chiffre d'affaires généré</p>
          </div>
          <div className="flex items-center gap-3 bg-surface-2 px-4 py-2.5 rounded-full border border-subtle w-full md:w-80 focus-within:border-brand transition-all">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-text-primary"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identité</th>
                <th>Contact</th>
                <th>Dernière Visite</th>
                <th>Visites</th>
                <th className="text-right">Volume Achat</th>
                <th className="text-right">Statut / Dette</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
                        {c.nom.substring(0, 2)}
                      </div>
                      <span className="font-bold text-sm text-text-primary">{c.nom}</span>
                      {i < 3 && <Star size={14} className="text-accent fill-accent" />}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Smartphone size={14} /> {c.contact}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-text-muted">
                      {new Date(c.derniereVisite).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-primary">{c.totalVisites} passages</span>
                  </td>
                  <td className="text-right">
                    <span className="font-bold text-brand">{c.totalAchat.toLocaleString()} XAF</span>
                  </td>
                  <td className="text-right">
                    {c.dette > 0 ? (
                      <span className="badge badge-warning">Dette: {c.dette.toLocaleString()} XAF</span>
                    ) : (
                      <span className="badge badge-success">À jour</span>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted font-medium">
                    Aucun client enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
