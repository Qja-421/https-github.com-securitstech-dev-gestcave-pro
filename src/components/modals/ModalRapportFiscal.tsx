import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, X, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface FiscalData {
  caMensuel: number;
  masseSalarialeBrute: number;
  loyer: number;
  electriciteEau: number;
  approvisionnements: number;
  licenceAlcool: number;
  forfaitBCDA: number;
  patenteMunicipale: number;
}

const ModalRapportFiscal = ({ 
  isOpen, 
  onClose, 
  defaultCA = 1850000,
  configEtab = {
    type_etablissement: 'bar_restaurant',
    tva_taux: 18,
    taxe_loisirs_taux: 5,
    taxe_tourisme_taux: 2,
    cnss_taux: 16.5,
    is_taux: 30
  }
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  defaultCA?: number,
  configEtab?: any
}) => {
  const [data, setData] = useState<FiscalData>({
    caMensuel: defaultCA,
    masseSalarialeBrute: 450000,
    loyer: 80000,
    electriciteEau: 35000,
    approvisionnements: 620000,
    licenceAlcool: configEtab.type_etablissement === 'boutique' ? 0 : 10000, // Mensuel (120k / 12)
    forfaitBCDA: configEtab.type_etablissement === 'boutique' ? 0 : 15000,
    patenteMunicipale: 5000 // Estimé mensuel
  });

  const calculerFiscalite = () => {
    const tva = data.caMensuel * (configEtab.tva_taux / 100);
    const taxeLoisirs = configEtab.type_etablissement === 'boutique' ? 0 : data.caMensuel * (configEtab.taxe_loisirs_taux / 100);
    const taxeTourisme = configEtab.type_etablissement === 'boutique' ? 0 : data.caMensuel * (configEtab.taxe_tourisme_taux / 100);
    const cnssEmployeur = data.masseSalarialeBrute * (configEtab.cnss_taux / 100);
    
    // Bénéfice avant IS (simplifié)
    const chargesTotales = data.masseSalarialeBrute + data.loyer + data.electriciteEau + data.approvisionnements + data.licenceAlcool + data.forfaitBCDA + data.patenteMunicipale + cnssEmployeur + taxeLoisirs + taxeTourisme;
    const beneficeBrut = data.caMensuel - chargesTotales;
    const is = beneficeBrut > 0 ? beneficeBrut * (configEtab.is_taux / 100) : 0;
    
    const resultatNet = beneficeBrut - is;

    return {
      tva,
      taxeLoisirs,
      taxeTourisme,
      cnssEmployeur,
      is,
      chargesTotales,
      beneficeBrut,
      resultatNet
    };
  };

  const genererPDF = () => {
    const res = calculerFiscalite();
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("GESTCAVE PRO", 14, 20);
    doc.setFontSize(14); doc.text(`RAPPORT COMPTABLE ET FISCAL - ${date.toUpperCase()}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [['Désignation', 'Valeur (FCFA)']],
      body: [
        ['Chiffre d\'Affaires (CA) HT', data.caMensuel.toLocaleString()],
        ['--- CHARGES VARIABLES ---', ''],
        ['Approvisionnements (Achats)', data.approvisionnements.toLocaleString()],
        ['--- CHARGES FIXES ---', ''],
        ['Masse Salariale Brute', data.masseSalarialeBrute.toLocaleString()],
        ['Loyer', data.loyer.toLocaleString()],
        ['Électricité + Eau', data.electriciteEau.toLocaleString()],
        ['Licence Alcool (Quote-part mensuelle)', data.licenceAlcool.toLocaleString()],
        ['Forfait BCDA', data.forfaitBCDA.toLocaleString()],
        ['Patente Municipale', data.patenteMunicipale.toLocaleString()],
        ['--- TAXES & COTISATIONS ---', ''],
        ['TVA (' + configEtab.tva_taux + '%)', res.tva.toLocaleString()],
        ['Taxe Loisirs (' + configEtab.taxe_loisirs_taux + '%)', res.taxeLoisirs.toLocaleString()],
        ['Taxe Tourisme (' + configEtab.taxe_tourisme_taux + '%)', res.taxeTourisme.toLocaleString()],
        ['CNSS Employeur (' + configEtab.cnss_taux + '%)', res.cnssEmployeur.toLocaleString()],
        ['Impôt sur les Bénéfices (IS ' + configEtab.is_taux + '%)', res.is.toLocaleString()],
      ],
      headStyles: { fillColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16); doc.setTextColor(5, 150, 105);
    doc.text(`RÉSULTAT NET DU MOIS : ${res.resultatNet.toLocaleString()} FCFA`, 14, finalY);

    doc.save(`Rapport_Compta_${date.replace(' ', '_')}.pdf`);
    toast.success("Rapport fiscal exporté !");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
        
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Calculator size={32} /></div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Module Comptabilité & Fiscalité</h3>
          <p className="text-slate-500 font-medium">Calcul automatique des charges selon la réglementation du Congo.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Données d'Exploitation</h4>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">CA Mensuel (FCFA)</label>
              <input type="number" value={data.caMensuel} onChange={(e)=>setData({...data, caMensuel: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Approvisionnements</label>
              <input type="number" value={data.approvisionnements} onChange={(e)=>setData({...data, approvisionnements: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Masse Salariale Brute</label>
              <input type="number" value={data.masseSalarialeBrute} onChange={(e)=>setData({...data, masseSalarialeBrute: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Charges Fixes & Forfaits</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Loyer</label>
                <input type="number" value={data.loyer} onChange={(e)=>setData({...data, loyer: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Eau/Elec</label>
                <input type="number" value={data.electriciteEau} onChange={(e)=>setData({...data, electriciteEau: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">BCDA (Forfait)</label>
                <input type="number" value={data.forfaitBCDA} onChange={(e)=>setData({...data, forfaitBCDA: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Licence (Mens.)</label>
                <input type="number" value={data.licenceAlcool} onChange={(e)=>setData({...data, licenceAlcool: Number(e.target.value)})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TVA ({configEtab.tva_taux}%)</p>
              <p className="text-xl font-black">{calculerFiscalite().tva.toLocaleString()} F</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">IS ({configEtab.is_taux}%)</p>
              <p className="text-xl font-black">{calculerFiscalite().is.toLocaleString()} F</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Charges Totales</p>
              <p className="text-xl font-black text-rose-500">{calculerFiscalite().chargesTotales.toLocaleString()} F</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Résultat Net</p>
              <p className="text-2xl font-black text-emerald-400">{calculerFiscalite().resultatNet.toLocaleString()} F</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 text-slate-400 font-bold uppercase text-[11px] tracking-widest">Fermer</button>
          <button onClick={genererPDF} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
            <Download size={20} /> Exporter le Rapport Complet
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalRapportFiscal;
