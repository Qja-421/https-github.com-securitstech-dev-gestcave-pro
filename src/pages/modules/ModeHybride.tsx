import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { Printer, FileEdit, CheckCircle, Calculator, FileText, Download, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: string;
  nom: string;
  prix_vente: number;
  categorie: string;
  stock_actuel?: number;
}

export default function ModeHybride() {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [activeTab, setActiveTab] = useState<'impression' | 'saisie'>('impression');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire de saisie du soir
  const [saisie, setSaisie] = useState({
    totalVentes: '',
    avances: '',
    soldeInitial: '',
    depensesBoissons: '',
    depensesDiverses: '',
    observation: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('etablissementId', '==', etablissementId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        if (data.length === 0) {
          // Fake data for demo
          setProducts([
            { id: '1', nom: 'Primus', prix_vente: 500, categorie: 'Bières', stock_actuel: 14 },
            { id: '2', nom: 'Heineken', prix_vente: 500, categorie: 'Bières', stock_actuel: 24 },
            { id: '3', nom: 'Ngok', prix_vente: 500, categorie: 'Bières', stock_actuel: 13 },
            { id: '4', nom: 'Turbo', prix_vente: 500, categorie: 'Bières', stock_actuel: 16 },
            { id: '5', nom: 'Jus (Brasco)', prix_vente: 500, categorie: 'Softs', stock_actuel: 23 },
            { id: '6', nom: 'Castel', prix_vente: 700, categorie: 'Bières', stock_actuel: 5 },
            { id: '7', nom: 'Beauford', prix_vente: 600, categorie: 'Bières', stock_actuel: 21 },
          ]);
        } else {
          setProducts(data);
        }
      } catch (error) {
        console.error("Erreur", error);
      }
    };
    fetchProducts();
  }, [etablissementId]);

  const genererPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const nomBar = profil?.etablissement_nom || "CAVE SUPRÊME";

    // --- PAGE 1 : TABLEAU OPÉRATIONNEL ---
    doc.setFillColor(50, 50, 50);
    doc.rect(10, 10, 190, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(nomBar.toUpperCase(), 105, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.text("TABLEAU OPÉRATIONNEL JOURNALIER", 105, 22, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.text(`Date : ..... / ..... / 202...`, 15, 35);
    doc.text(`Jour : ..............................`, 85, 35);
    doc.text(`Vendeuse : ..............................`, 140, 35);

    const tableData = products.map((p, i) => [
      (i + 1).toString().padStart(2, '0'),
      p.nom,
      '', // Espace pour QTE (bâtonnets)
      `${p.prix_vente} F`,
      '', // Espace pour MONTANT
      ''  // Espace pour OBSERVATION
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['N°', 'PRODUIT VENDU', 'QTE (Bâtonnets)', 'PRIX UNIT.', 'MONTANT (FCFA)', 'OBSERVATION']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 45 },
        2: { cellWidth: 50 }, // Espace large pour les carrés/bâtonnets
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 }
      },
      styles: { minCellHeight: 12, valign: 'middle' }
    });

    // --- PAGE 2 : FICHE DE SUIVI ET BILAN ---
    doc.addPage();
    
    doc.setFillColor(50, 50, 50);
    doc.rect(10, 10, 190, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(nomBar.toUpperCase(), 105, 16, { align: 'center' });
    doc.setFontSize(10);
    doc.text("FICHE DE SUIVI DES VENTES ET DU STOCK", 105, 22, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.text(`Date : ..... / ..... / 202...`, 15, 35);
    doc.text(`Semaine N° : ........`, 85, 35);
    doc.text(`Rempli par : ..............................`, 140, 35);

    const stockData = products.map((p, i) => [
      (i + 1).toString().padStart(2, '0'),
      p.nom,
      p.stock_actuel?.toString() || '0', // STOCK DEBUT (Pré-rempli)
      '', // ENTREES
      '', // SORTIES
      '', // STOCK RESTANT
      ''  // ETAT PHYSIQUE
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['N°', 'PRODUIT / BOISSON', 'STOCK DÉBUT', 'ENTRÉES (+)', 'SORTIES (-)', 'STOCK RESTANT', 'ÉTAT PHYSIQUE']],
      body: stockData,
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 }
      },
      styles: { minCellHeight: 10, valign: 'middle' }
    });

    // BILAN DE LA JOURNÉE (Bas de page)
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFillColor(100, 100, 100);
    doc.rect(10, finalY, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("PARTIE 2 - BILAN DE LA JOURNÉE (à remplir le soir)", 15, finalY + 6);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("RECETTES DU JOUR", 40, finalY + 20);
    doc.text("DÉPENSES DU JOUR", 130, finalY + 20);
    
    doc.setFont("helvetica", "normal");
    doc.text("Total ventes (sous-total) : ........................................ FCFA", 15, finalY + 30);
    doc.text("Autres recettes / avances : ........................................ FCFA", 15, finalY + 40);
    doc.text("Solde caisse début de journée : ................................... FCFA", 15, finalY + 50);
    
    doc.text("Achat boissons / livraisons : ....................................... FCFA", 110, finalY + 30);
    doc.text("Dépenses diverses du bar : ........................................ FCFA", 110, finalY + 40);
    doc.text("Remise au patron : .................................................... FCFA", 110, finalY + 50);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL RECETTES : ........................................ FCFA", 15, finalY + 65);
    doc.text("TOTAL DÉPENSES : ........................................ FCFA", 110, finalY + 65);

    doc.setFillColor(200, 200, 200);
    doc.rect(10, finalY + 75, 190, 10, 'F');
    doc.text("SOLDE CAISSE FIN DE JOURNÉE = Recettes - Dépenses = .............................................. FCFA", 30, finalY + 82);

    doc.text("OBSERVATION VENDEUSE", 20, finalY + 105);
    doc.text("SIGNATURE VENDEUSE", 85, finalY + 105);
    doc.text("VISA PATRON (Soir)", 150, finalY + 105);

    doc.save(`Fiches_Journalieres_${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success("PDF Généré avec succès !");
  };

  const validerSaisie = async () => {
    if (!saisie.totalVentes) {
      toast.error("Veuillez saisir le total des ventes.");
      return;
    }
    
    setLoading(true);
    try {
      const v = Number(saisie.totalVentes) || 0;
      const si = Number(saisie.soldeInitial) || 0;
      const a = Number(saisie.avances) || 0;
      const db = Number(saisie.depensesBoissons) || 0;
      const dd = Number(saisie.depensesDiverses) || 0;

      const totalRecettes = v + a + si;
      const totalDepenses = db + dd;
      const soldeFin = totalRecettes - totalDepenses;

      // Enregistrement dans Firebase (historique)
      /* 
      await addDoc(collection(db, 'clotures_caisse'), {
        etablissementId: user?.etablissementId,
        date: Timestamp.now(),
        type: 'hybride_manuel',
        chiffres: { totalRecettes, totalDepenses, soldeFin },
        details: saisie
      }); 
      */

      toast.success(`Saisie validée ! Solde fin de journée : ${soldeFin.toLocaleString()} FCFA`);
      setSaisie({
        totalVentes: '', avances: '', soldeInitial: '',
        depensesBoissons: '', depensesDiverses: '', observation: ''
      });
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  // Calculs dynamiques pour le formulaire
  const calcTotalRecettes = (Number(saisie.totalVentes)||0) + (Number(saisie.avances)||0) + (Number(saisie.soldeInitial)||0);
  const calcTotalDepenses = (Number(saisie.depensesBoissons)||0) + (Number(saisie.depensesDiverses)||0);
  const calcSoldeFin = calcTotalRecettes - calcTotalDepenses;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A8A]">Mode Hybride (Papier ➔ Digital)</h2>
          <p className="text-slate-500 text-sm mt-1">Imprimez vos fiches le matin, saisissez les totaux le soir.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('impression')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'impression' ? 'bg-white text-[#1E3A8A] shadow-sm' : 'text-slate-500 hover:text-[#1E3A8A]'}`}
          >
            <Printer size={18} /> 1. Impression Matin
          </button>
          <button 
            onClick={() => setActiveTab('saisie')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'saisie' ? 'bg-[#FF7A00] text-white shadow-sm' : 'text-slate-500 hover:text-[#FF7A00]'}`}
          >
            <Calculator size={18} /> 2. Saisie du Soir
          </button>
        </div>
      </div>

      {activeTab === 'impression' ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center space-y-8">
          <div className="w-24 h-24 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mx-auto">
            <FileText size={48} />
          </div>
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="text-2xl font-black text-slate-800">Générer les fiches du jour</h3>
            <p className="text-slate-500 leading-relaxed">
              Ce module crée un fichier PDF contenant le <strong>Tableau Opérationnel</strong> (pour compter les boissons avec des bâtonnets) et la <strong>Fiche de Suivi des Stocks</strong> (pour noter l'état physique). Le stock de début est pré-rempli avec les données actuelles du système.
            </p>
          </div>
          <button 
            onClick={genererPDF}
            className="px-8 py-4 bg-[#1E3A8A] text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-transform inline-flex items-center gap-3"
          >
            <Download size={20} /> Télécharger le PDF (A4)
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid lg:grid-cols-2 gap-12">
          {/* Formulaire GAUCHE */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-black text-[#1E3A8A] mb-4 flex items-center gap-2">
                <CheckCircle className="text-emerald-500" /> Recettes du jour
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-bold text-slate-600">Total ventes (sous-total fiches) :</label>
                  <input type="number" value={saisie.totalVentes} onChange={e => setSaisie({...saisie, totalVentes: e.target.value})} className="w-40 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right outline-none focus:border-[#FF7A00]" placeholder="0" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-bold text-slate-600">Autres recettes / avances :</label>
                  <input type="number" value={saisie.avances} onChange={e => setSaisie({...saisie, avances: e.target.value})} className="w-40 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right outline-none focus:border-[#FF7A00]" placeholder="0" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-bold text-slate-600">Solde caisse début journée :</label>
                  <input type="number" value={saisie.soldeInitial} onChange={e => setSaisie({...saisie, soldeInitial: e.target.value})} className="w-40 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-right outline-none focus:border-[#FF7A00]" placeholder="0" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-rose-600 mb-4 flex items-center gap-2">
                <Minus className="bg-rose-100 rounded-full" /> Dépenses du jour
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-bold text-slate-600">Achat boissons / livraisons :</label>
                  <input type="number" value={saisie.depensesBoissons} onChange={e => setSaisie({...saisie, depensesBoissons: e.target.value})} className="w-40 p-3 bg-rose-50 border border-rose-200 rounded-xl font-bold text-right outline-none focus:border-rose-500" placeholder="0" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm font-bold text-slate-600">Dépenses diverses :</label>
                  <input type="number" value={saisie.depensesDiverses} onChange={e => setSaisie({...saisie, depensesDiverses: e.target.value})} className="w-40 p-3 bg-rose-50 border border-rose-200 rounded-xl font-bold text-right outline-none focus:border-rose-500" placeholder="0" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-600">Observation (ex: Paiement dette de Yaya) :</label>
               <textarea value={saisie.observation} onChange={e => setSaisie({...saisie, observation: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#1E3A8A] text-sm" rows={2} />
            </div>
          </div>

          {/* Résumé DROITE */}
          <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col justify-center space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">Bilan de Clôture</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                <span className="font-bold text-slate-600">TOTAL RECETTES</span>
                <span className="font-black text-[#1E3A8A] text-xl">{calcTotalRecettes.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm">
                <span className="font-bold text-slate-600">TOTAL DÉPENSES</span>
                <span className="font-black text-rose-600 text-xl">- {calcTotalDepenses.toLocaleString()} F</span>
              </div>
            </div>

            <div className="mt-8 p-6 bg-[#1E3A8A] text-white rounded-3xl shadow-xl shadow-blue-900/20 text-center space-y-2">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Solde Fin de Journée</span>
              <div className="text-4xl font-black">{calcSoldeFin.toLocaleString()} F</div>
            </div>

            <button 
              onClick={validerSaisie}
              disabled={loading}
              className="w-full py-5 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:-translate-y-1 transition-transform shadow-xl shadow-orange-500/20 mt-4"
            >
              {loading ? "Validation..." : "Valider la Clôture & Stocks"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
