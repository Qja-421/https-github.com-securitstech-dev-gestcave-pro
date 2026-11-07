import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { Database, Zap, CheckCircle2, AlertTriangle, Users, Wine, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const SimulationLab = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seedRealisticData = async () => {
    if (!etablissementId) {
      let detail = "Veuillez vous reconnecter.";
      if (!profil) detail = "Profil utilisateur non chargé.";
      else if (profil.role === 'super_admin' && !etablissementSimuleId) detail = "Veuillez sélectionner un établissement à inspecter.";
      else if (!profil.etablissement_id) detail = "Votre profil n'est lié à aucun établissement.";
      
      return toast.error(`Erreur : ${detail} (ID absent)`);
    }
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const etablissement_id = etablissementId;

      // 1. PRODUITS & STOCKS (Boissons -> Bar, Nourriture -> Cuisine/Grill en Unités)
      const produits = [
        // BOISSONS (Destination: BAR)
        { nom: "Heineken 33cl", categorie: "Boisson", prix: 1500, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, emoji: "🍺", destination_production: "bar", uniteMesure: "bouteilles" },
        { nom: "Castel 65cl", categorie: "Boisson", prix: 1200, stockTotal: 240, stockAlerte: 48, unitesParCasier: 12, emoji: "🍺", destination_production: "bar", uniteMesure: "bouteilles" },
        { nom: "Coca-Cola 33cl", categorie: "Boisson", prix: 1000, stockTotal: 120, stockAlerte: 24, unitesParCasier: 24, emoji: "🥤", destination_production: "bar", uniteMesure: "bouteilles" },
        { nom: "Eau Minérale 1.5L", categorie: "Boisson", prix: 800, stockTotal: 60, stockAlerte: 12, unitesParCasier: 6, emoji: "💧", destination_production: "bar", uniteMesure: "bouteilles" },
        { nom: "Jack Daniels (Bouteille)", categorie: "Boisson", prix: 45000, stockTotal: 12, stockAlerte: 3, unitesParCasier: 1, emoji: "🥃", destination_production: "bar", uniteMesure: "bouteilles" },
        
        // NOURRITURE (Destination: CUISINE/GRILL, Unité: UNITÉS)
        { nom: "Poulet Braisé", categorie: "Plat", prix: 12000, stockTotal: 50, stockAlerte: 5, unitesParCasier: 1, emoji: "🍗", destination_production: "grill", uniteMesure: "unités" },
        { nom: "Poisson Braisé", categorie: "Plat", prix: 15000, stockTotal: 30, stockAlerte: 5, unitesParCasier: 1, emoji: "🐟", destination_production: "grill", uniteMesure: "unités" },
        { nom: "Pizza Royale", categorie: "Plat", prix: 8500, stockTotal: 50, stockAlerte: 10, unitesParCasier: 1, emoji: "🍕", destination_production: "pizzeria", uniteMesure: "unités" },
        { nom: "Frites de Pomme", categorie: "A-Côté", prix: 2000, stockTotal: 100, stockAlerte: 10, unitesParCasier: 1, emoji: "🍟", destination_production: "cuisine", uniteMesure: "unités" },
        { nom: "Alloco", categorie: "A-Côté", prix: 2500, stockTotal: 80, stockAlerte: 10, unitesParCasier: 1, emoji: "🍌", destination_production: "cuisine", uniteMesure: "unités" }
      ];

      for (const p of produits) {
        const pRef = doc(collection(db, 'produits'));
        batch.set(pRef, { ...p, etablissement_id, dateCreation: new Date().toISOString() });
      }

      // 2. PERSONNEL (12 Agents)
      const employes = [
        { nom: "Jean (Serveur 1)", role: "serveur", salaire: 85000, pin: "1111" },
        { nom: "Marie (Serveur 2)", role: "serveur", salaire: 85000, pin: "2222" },
        { nom: "Paul (Serveur 3)", role: "serveur", salaire: 85000, pin: "3333" },
        { nom: "Alice (Serveur 4)", role: "serveur", salaire: 85000, pin: "4444" },
        { nom: "Marc (Barman/Caissier 1)", role: "caissier", salaire: 125000, pin: "5555" },
        { nom: "Sophie (Barman/Caissier 2)", role: "caissier", salaire: 125000, pin: "6666" },
        { nom: "Chef Ibrahim", role: "cuisine", salaire: 150000, pin: "7777" },
        { nom: "Awa (Cuisine)", role: "cuisine", salaire: 90000, pin: "8888" },
        { nom: "Bakary (Sécurité 1)", role: "securite", salaire: 75000, pin: "9999" },
        { nom: "Moussa (Sécurité 2)", role: "securite", salaire: 75000, pin: "1010" },
        { nom: "Fatou (Nettoyage 1)", role: "agent_nettoyage", salaire: 65000, pin: "2020" },
        { nom: "Kader (Nettoyage 2)", role: "agent_nettoyage", salaire: 65000, pin: "3030" }
      ];

      for (const emp of employes) {
        const empRef = doc(collection(db, 'employes'));
        batch.set(empRef, { 
          ...emp, 
          etablissement_id, 
          actif: true, 
          dateCreation: new Date().toISOString(),
          typeSalaire: 'mensuel'
        });
      }

      // 3. TABLES
      const zones = ["Comptoir", "Salle", "VIP", "Terrasse"];
      for (const zone of zones) {
        for (let i = 1; i <= 3; i++) {
          const tRef = doc(collection(db, 'tables'));
          batch.set(tRef, { 
            nom: `${zone.charAt(0)}${i}`, 
            zone: zone.toLowerCase(), 
            capacite: zone === "VIP" ? 6 : 4, 
            statut: "disponible",
            etablissement_id 
          });
        }
      }

      await batch.commit();
      setDone(true);
      toast.success("Structure opérationnelle générée !");
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-16 h-16 bg-[#1E3A8A] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
            <Zap size={32} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight uppercase">Config. Métier</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Structure Réelle Bar & Restaurant</p>
          </div>
        </div>

        {!done ? (
          <div className="space-y-8 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                <Wine className="text-[#1E3A8A] mb-4 group-hover:scale-110 transition-transform" size={24} />
                <p className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Boissons au Bar</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Gestion par le Barman/Caissier</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-orange-100 transition-all">
                <Utensils className="text-[#FF7A00] mb-4 group-hover:scale-110 transition-transform" size={24} />
                <p className="text-xs font-black text-[#FF7A00] uppercase tracking-widest">Cuisine en Unités</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Plats & Portions (Pas de bouteilles)</p>
              </div>
            </div>

            <div className="bg-[#1E3A8A] text-white rounded-[2rem] p-8 shadow-xl shadow-blue-900/20">
              <div className="flex gap-4 items-start mb-4">
                <AlertTriangle className="shrink-0 text-[#FF7A00]" size={24} />
                <p className="text-sm font-bold leading-relaxed">
                  Cette configuration va créer 12 agents, vos stocks de boissons et nourriture, ainsi que vos tables réparties par zone (Comptoir, VIP, etc.).
                </p>
              </div>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-[0.2em]">PIN par défaut : 1111, 2222, ... 5555 pour le Barman.</p>
            </div>

            <button
              onClick={seedRealisticData}
              disabled={loading}
              className="w-full h-20 bg-[#FF7A00] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={24} fill="currentColor" />
                  Générer ma structure
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-10 relative z-10 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-[#1E3A8A] mb-3 uppercase tracking-tight">C'est en place !</h3>
            <p className="text-slate-400 text-sm font-bold mb-10 max-w-xs mx-auto">
              Votre Barman est au comptoir, votre cuisine est prête et vos serveurs ont leurs PIN.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.href = '/tableau-de-bord/plan-salles'}
                className="w-full h-16 bg-[#1E3A8A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all shadow-lg"
              >
                Lancer une vente
              </button>
              <button 
                onClick={() => window.location.href = '/tableau-de-bord/stocks'}
                className="w-full h-16 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
              >
                Vérifier les stocks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationLab;
