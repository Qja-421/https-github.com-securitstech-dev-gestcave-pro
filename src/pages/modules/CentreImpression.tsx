import React, { useState } from 'react';
import { Printer, FileText, Users, ClipboardList, ArrowLeft, Download, ShieldCheck, Receipt, Wallet, Database, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const CentreImpression = () => {
  const navigate = useNavigate();
  const { profil } = useAuthStore();
  const [docActif, setDocActif] = useState<'inventaire' | 'pointage' | 'paie' | 'ventes' | 'caisse' | 'stock' | null>(null);

  const etablissementNom = profil?.etablissement_nom || 'GESTCAVE PRO';

  const imprimer = () => {
    window.print();
  };

  return (
    <div className="h-screen flex bg-slate-50 font-['Inter',sans-serif] overflow-hidden">
      
      {/* Sidebar - Ne s'imprime pas */}
      <div className="w-80 bg-[#1E3A8A] flex flex-col shadow-2xl print:hidden z-10">
        <div className="p-8">
            <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all mb-8">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none mb-2">Centre<br/><span className="text-[#FF7A00]">d'Impression</span></h1>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-4 opacity-60">Documents Officiels</p>
        </div>

        <div className="px-4 space-y-2 flex-1">
            <button 
                onClick={() => setDocActif('inventaire')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'inventaire' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <ClipboardList size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Inventaire Physique</span>
            </button>
            <button 
                onClick={() => setDocActif('pointage')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'pointage' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <Users size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Fiche de Pointage</span>
            </button>
            <button 
                onClick={() => setDocActif('paie')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'paie' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <FileText size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Quittance de Paie</span>
            </button>
            <button 
                onClick={() => setDocActif('ventes')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'ventes' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <Receipt size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Fiche de Ventes</span>
            </button>
            <button 
                onClick={() => setDocActif('caisse')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'caisse' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <Wallet size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Feuille de Caisse</span>
            </button>
            <button 
                onClick={() => setDocActif('stock')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${docActif === 'stock' ? 'bg-[#FF7A00] text-white shadow-lg' : 'text-blue-200 hover:bg-white/5'}`}
            >
                <Database size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Contrôle Stocks</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-100 relative overflow-y-auto print:bg-white">
          {!docActif ? (
             <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-40 print:hidden">
                 <Printer size={80} className="text-[#1E3A8A] mb-8" />
                 <h2 className="text-2xl font-black text-[#1E3A8A] tracking-tighter uppercase">Sélectionnez un document</h2>
                 <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-4">Pour générer une fiche imprimable</p>
             </div>
          ) : (
            <div className="p-8 print:p-0 max-w-4xl mx-auto w-full">
                {/* Actions Bar - Hidden in print */}
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-8 flex justify-end items-center gap-4 print:hidden">
                    <button onClick={imprimer} className="px-6 py-3 bg-[#1E3A8A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2">
                        <Printer size={16} /> Lancer l'impression
                    </button>
                </div>

                {/* Printable Area */}
                <div className="bg-white p-12 min-h-[297mm] w-full shadow-2xl print:shadow-none print:p-0 print:border-none text-black">
                    
                    {/* Header Commun */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">{etablissementNom}</h1>
                            <p className="text-sm font-bold uppercase tracking-widest mt-2 text-gray-500">Document Administratif Officiel</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold uppercase">Date: ____ / ____ / 202__</p>
                            <p className="text-sm font-bold uppercase mt-2">Resp: ___________________</p>
                        </div>
                    </div>

                    {/* Contenu dynamique selon le document */}
                    {docActif === 'inventaire' && (
                        <div>
                            <h2 className="text-2xl font-black uppercase text-center mb-8 bg-gray-100 p-4">Fiche d'Inventaire Physique de Fin de Service</h2>
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-3 text-left font-bold uppercase">Désignation Produit</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-24">Stock Théo.</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-24">Compté</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-24">Écart</th>
                                        <th className="border border-black p-3 text-left font-bold uppercase w-48">Observations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({length: 25}).map((_, i) => (
                                        <tr key={i}>
                                            <td className="border border-black p-3 h-10"></td>
                                            <td className="border border-black p-3 h-10 bg-gray-50"></td>
                                            <td className="border border-black p-3 h-10"></td>
                                            <td className="border border-black p-3 h-10"></td>
                                            <td className="border border-black p-3 h-10"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-12 flex justify-between">
                                <div className="text-center">
                                    <p className="font-bold uppercase mb-16">Signature du Contrôleur</p>
                                    <p>_______________________</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold uppercase mb-16">Signature du Gérant</p>
                                    <p>_______________________</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {docActif === 'pointage' && (
                        <div>
                            <h2 className="text-2xl font-black uppercase text-center mb-8 bg-gray-100 p-4">Registre Manuel de Présence</h2>
                            <p className="text-sm mb-6 italic">À n'utiliser qu'en cas de panne matérielle. Les données doivent être saisies dans GestCave Pro ultérieurement.</p>
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-3 text-left font-bold uppercase">Nom de l'Employé</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-32">Heure Arrivée</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-32">Signature</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-32">Heure Départ</th>
                                        <th className="border border-black p-3 text-center font-bold uppercase w-32">Signature</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({length: 20}).map((_, i) => (
                                        <tr key={i}>
                                            <td className="border border-black p-3 h-12"></td>
                                            <td className="border border-black p-3 h-12"></td>
                                            <td className="border border-black p-3 h-12"></td>
                                            <td className="border border-black p-3 h-12"></td>
                                            <td className="border border-black p-3 h-12"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {docActif === 'paie' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                            {/* Deux reçus par page */}
                            {[1, 2].map((num) => (
                                <div key={num} className="border-2 border-black p-6 relative">
                                    <div className="absolute top-4 right-4 opacity-10">
                                        <ShieldCheck size={100} />
                                    </div>
                                    <h2 className="text-xl font-black uppercase mb-6 border-b border-black pb-4">Quittance de Paiement (Salaire)</h2>
                                    
                                    <div className="space-y-4 text-sm font-bold">
                                        <p className="flex justify-between">
                                            <span className="uppercase">Employé :</span>
                                            <span className="border-b border-dashed border-gray-400 w-48 inline-block"></span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="uppercase">Mois de :</span>
                                            <span className="border-b border-dashed border-gray-400 w-48 inline-block"></span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="uppercase">Salaire de Base :</span>
                                            <span className="border-b border-dashed border-gray-400 w-48 inline-block"></span>
                                        </p>
                                        <p className="flex justify-between text-red-600">
                                            <span className="uppercase">Malus Retards :</span>
                                            <span className="border-b border-dashed border-red-400 w-48 inline-block"></span>
                                        </p>
                                        <p className="flex justify-between text-green-600">
                                            <span className="uppercase">Avances (À Déduire) :</span>
                                            <span className="border-b border-dashed border-green-400 w-48 inline-block"></span>
                                        </p>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-100 border border-black flex justify-between items-center">
                                        <span className="font-black uppercase text-lg">Net Payé :</span>
                                        <span className="font-black text-xl">________________ XAF</span>
                                    </div>

                                    <p className="text-xs italic mt-4 text-justify">Je soussigné(e) reconnais avoir reçu la somme susmentionnée pour solde de tout compte concernant la période indiquée. Je valide les retenues appliquées par le système GestCave Pro.</p>

                                    <div className="mt-8 pt-4">
                                        <p className="font-bold uppercase text-right mr-4 mb-16">Signature de l'Employé</p>
                                        <p className="text-right mr-4">_______________________</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {docActif === 'ventes' && (
                        <div>
                            <h2 className="text-2xl font-black uppercase text-center mb-8 bg-gray-100 p-4">Fiche de Suivi des Ventes Manuelles</h2>
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-2 text-left font-bold uppercase w-12">Réf</th>
                                        <th className="border border-black p-2 text-left font-bold uppercase">Article / Désignation</th>
                                        <th className="border border-black p-2 text-center font-bold uppercase w-16">P.U</th>
                                        <th className="border border-black p-2 text-center font-bold uppercase w-12">Qté</th>
                                        <th className="border border-black p-2 text-center font-bold uppercase w-20">Total</th>
                                        <th className="border border-black p-2 text-center font-bold uppercase w-20">Mode</th>
                                        <th className="border border-black p-2 text-left font-bold uppercase w-32">Client / Table</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({length: 30}).map((_, i) => (
                                        <tr key={i}>
                                            <td className="border border-black p-2 h-8 text-gray-300">{i+1}</td>
                                            <td className="border border-black p-2 h-8"></td>
                                            <td className="border border-black p-2 h-8"></td>
                                            <td className="border border-black p-2 h-8"></td>
                                            <td className="border border-black p-2 h-8"></td>
                                            <td className="border border-black p-2 h-8"></td>
                                            <td className="border border-black p-2 h-8"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {docActif === 'caisse' && (
                        <div className="space-y-12">
                            <h2 className="text-2xl font-black uppercase text-center mb-8 bg-gray-100 p-4">Feuille de Caisse et Arrêté Journalier</h2>
                            
                            <div className="grid grid-cols-2 gap-8">
                                <div className="border-2 border-black p-6">
                                    <h3 className="font-black uppercase mb-4 border-b border-black pb-2">Recettes (Entrées)</h3>
                                    <div className="space-y-4 text-sm font-bold">
                                        <p className="flex justify-between"><span>TOTAL ESPÈCES :</span><span>________________ F</span></p>
                                        <p className="flex justify-between"><span>TOTAL MOBILE MONEY :</span><span>________________ F</span></p>
                                        <p className="flex justify-between"><span>TOTAL CARTES :</span><span>________________ F</span></p>
                                        <p className="flex justify-between text-orange-600"><span>TOTAL CRÉDITS :</span><span>________________ F</span></p>
                                        <div className="border-t-2 border-black pt-4 flex justify-between font-black text-lg">
                                            <span>TOTAL GÉNÉRAL :</span><span>________________ F</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-2 border-black p-6">
                                    <h3 className="font-black uppercase mb-4 border-b border-black pb-2">Dépenses (Sorties)</h3>
                                    <div className="space-y-4 text-sm font-bold">
                                        <p className="flex justify-between"><span>ACHATS / REAPPRO :</span><span>________________ F</span></p>
                                        <p className="flex justify-between"><span>CHARGES (EAU/ELEC) :</span><span>________________ F</span></p>
                                        <p className="flex justify-between"><span>AUTRES FRAIS :</span><span>________________ F</span></p>
                                        <div className="border-t-2 border-black pt-4 flex justify-between font-black text-lg">
                                            <span>TOTAL DÉPENSES :</span><span>________________ F</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-4 border-black p-8 bg-gray-50 text-center">
                                <p className="text-xl font-black uppercase mb-4">Solde Net Final (Caisse Physique)</p>
                                <p className="text-5xl font-black">________________________ XAF</p>
                            </div>

                            <div className="grid grid-cols-3 gap-8 text-center pt-8">
                                <div>
                                    <p className="font-bold uppercase mb-12">Caissier</p>
                                    <p>________________</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase mb-12">Contrôleur</p>
                                    <p>________________</p>
                                </div>
                                <div>
                                    <p className="font-bold uppercase mb-12">La Gérance</p>
                                    <p>________________</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {docActif === 'stock' && (
                        <div className="space-y-12">
                            <h2 className="text-2xl font-black uppercase text-center mb-8 bg-gray-100 p-4">Fiche de Contrôle Physique des Stocks (Inventaire)</h2>
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr className="bg-gray-100 text-center font-black uppercase">
                                        <th className="border border-black p-2 text-left w-64">Désignation Produit</th>
                                        <th className="border border-black p-2 w-20">Unité</th>
                                        <th className="border border-black p-2 w-24">Stock Théorique</th>
                                        <th className="border border-black p-2 w-24 bg-orange-50">Stock Physique (Plein)</th>
                                        <th className="border border-black p-2 w-24">Vides</th>
                                        <th className="border border-black p-2 w-24">Casse / Pertes</th>
                                        <th className="border border-black p-2 w-32">Observations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({length: 35}).map((_, i) => (
                                        <tr key={i} className="h-9">
                                            <td className="border border-black p-2 text-gray-300 italic">{i+1}. __________________________</td>
                                            <td className="border border-black p-2"></td>
                                            <td className="border border-black p-2 text-center text-gray-200">___</td>
                                            <td className="border border-black p-2 bg-orange-50/20"></td>
                                            <td className="border border-black p-2"></td>
                                            <td className="border border-black p-2"></td>
                                            <td className="border border-black p-2"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="grid grid-cols-2 gap-12 pt-12">
                                <div className="border-2 border-black p-6">
                                    <p className="font-black uppercase mb-16 text-center underline">Signature du Responsable Stock</p>
                                    <p className="text-center font-bold">Nom : ____________________</p>
                                </div>
                                <div className="border-2 border-black p-6">
                                    <p className="font-black uppercase mb-16 text-center underline">Visa de la Gérance</p>
                                    <p className="text-center font-bold">Date : ____ / ____ / 2026</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}
      </div>

      <style>{`
        @media print {
            @page { margin: 0; size: A4 portrait; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .print\\:bg-white { background: white !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:p-0 { padding: 0 !important; }
            .print\\:border-none { border: none !important; }
            .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </div>
  );
};

export default CentreImpression;
