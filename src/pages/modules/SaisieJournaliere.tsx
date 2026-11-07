import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Package,
  Save,
  Search,
  Wallet,
} from 'lucide-react';
import { collection, doc, onSnapshot, query, where, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

type ProduitJournalier = {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  stockTotal: number;
  stockAlerte?: number;
  unitesParCasier?: number;
  uniteMesure?: string;
};

type LigneSaisie = {
  vendu: number;
  casse: number;
  observation: string;
};

const nombre = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const SaisieJournaliere = () => {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [produits, setProduits] = useState<ProduitJournalier[]>([]);
  const [saisies, setSaisies] = useState<Record<string, LigneSaisie>>({});
  const [dateJournee, setDateJournee] = useState(() => new Date().toISOString().slice(0, 10));
  const [vendeuse, setVendeuse] = useState('');
  const [fondDebut, setFondDebut] = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [remisePatron, setRemisePatron] = useState(0);
  const [autresRecettes, setAutresRecettes] = useState(0);
  const [soldePhysique, setSoldePhysique] = useState(0);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!etablissementId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'produits'), where('etablissement_id', '==', etablissementId));
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ProduitJournalier)
          .sort((a, b) => a.nom.localeCompare(b.nom));
        setProduits(data);
        setLoading(false);
      },
      (err) => {
        console.warn("produits listener error:", err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [etablissementId]);

  const produitsFiltres = useMemo(() => {
    const term = recherche.trim().toLowerCase();
    if (!term) return produits;
    return produits.filter((p) => `${p.nom} ${p.categorie}`.toLowerCase().includes(term));
  }, [produits, recherche]);

  const totaux = useMemo(() => {
    return produits.reduce(
      (acc, produit) => {
        const ligne = saisies[produit.id];
        const vendu = Math.max(0, nombre(ligne?.vendu));
        const casse = Math.max(0, nombre(ligne?.casse));
        const sortie = vendu + casse;
        const stockDepart = nombre(produit.stockTotal);
        const restant = Math.max(0, stockDepart - sortie);
        const montant = vendu * nombre(produit.prix);

        acc.vendus += vendu;
        acc.sorties += sortie;
        acc.ventes += montant;
        acc.alertes += restant <= nombre(produit.stockAlerte) ? 1 : 0;
        return acc;
      },
      { vendus: 0, sorties: 0, ventes: 0, alertes: 0 }
    );
  }, [produits, saisies]);

  const soldeCalcule = fondDebut + totaux.ventes + autresRecettes - depenses - remisePatron;
  const ecartCaisse = soldePhysique - soldeCalcule;

  const setLigne = (produitId: string, field: keyof LigneSaisie, value: string | number) => {
    setSaisies((prev) => {
      const current = prev[produitId] || { vendu: 0, casse: 0, observation: '' };
      return {
        ...prev,
        [produitId]: {
          ...current,
          [field]: field === 'observation' ? String(value) : Math.max(0, nombre(value)),
        },
      };
    });
  };

  const enregistrerJournee = async () => {
    if (!etablissementId) {
      toast.error("Etablissement introuvable");
      return;
    }

    const lignes = produits
      .map((produit) => {
        const saisie = saisies[produit.id];
        const vendu = Math.max(0, nombre(saisie?.vendu));
        const casse = Math.max(0, nombre(saisie?.casse));
        const sortie = vendu + casse;
        const stockDepart = nombre(produit.stockTotal);
        return {
          produitId: produit.id,
          produitNom: produit.nom,
          categorie: produit.categorie,
          prixUnitaire: nombre(produit.prix),
          stockDepart,
          vendu,
          casse,
          sortie,
          stockFinalCalcule: Math.max(0, stockDepart - sortie),
          observation: saisie?.observation || '',
        };
      })
      .filter((ligne) => ligne.vendu > 0 || ligne.casse > 0 || ligne.observation.trim());

    const lignesAvecStockInsuffisant = lignes.filter((ligne) => ligne.sortie > ligne.stockDepart);
    if (lignesAvecStockInsuffisant.length > 0) {
      toast.error(`Stock insuffisant pour ${lignesAvecStockInsuffisant[0].produitNom}`);
      return;
    }

    if (lignes.length === 0 && depenses <= 0 && autresRecettes <= 0) {
      toast.error("Aucune ligne a enregistrer");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Enregistrement de la fiche...");

    try {
      const batch = writeBatch(db);
      const maintenant = new Date().toISOString();
      const ficheRef = doc(collection(db, 'saisies_journalieres'));
      const totalVentes = lignes.reduce((sum, ligne) => sum + ligne.vendu * ligne.prixUnitaire, 0);

      batch.set(ficheRef, {
        etablissement_id: etablissementId,
        dateAffaire: dateJournee,
        date: maintenant,
        vendeuse: vendeuse || null,
        lignes,
        fondDebut,
        totalVentes,
        depenses,
        remisePatron,
        autresRecettes,
        soldeCalcule,
        soldePhysique,
        ecartCaisse,
        source: 'fiche_papier',
        saisiPar: profil?.id || null,
        statut: 'validee',
      });

      lignes.forEach((ligne) => {
        if (ligne.sortie <= 0) return;

        batch.update(doc(db, 'produits', ligne.produitId), {
          stockTotal: increment(-ligne.sortie),
        });

        batch.set(doc(collection(db, 'historique_stocks')), {
          produitId: ligne.produitId,
          produitNom: ligne.produitNom,
          type: 'sortie_saisie_journaliere',
          quantite: ligne.sortie,
          vendu: ligne.vendu,
          casse: ligne.casse,
          ancienStock: ligne.stockDepart,
          nouveauStock: ligne.stockFinalCalcule,
          date: maintenant,
          dateAffaire: dateJournee,
          etablissement_id: etablissementId,
          saisieJournaliereId: ficheRef.id,
          note: ligne.observation || 'Reprise manuelle depuis fiche papier',
        });
      });

      if (totalVentes > 0 || autresRecettes > 0) {
        batch.set(doc(collection(db, 'transactions_pos')), {
          etablissement_id: etablissementId,
          date: maintenant,
          dateAffaire: dateJournee,
          type: 'final',
          modePaiement: 'comptant',
          montant: totalVentes + autresRecettes,
          totalVente: totalVentes + autresRecettes,
          montantRestant: 0,
          source: 'saisie_journaliere',
          commandeId: ficheRef.id,
          serveurNom: vendeuse || 'Saisie journaliere',
          description: `Reprise fiche papier du ${dateJournee}`,
        });
      }

      if (depenses > 0) {
        batch.set(doc(collection(db, 'transactions_pos')), {
          etablissement_id: etablissementId,
          date: maintenant,
          dateAffaire: dateJournee,
          type: 'depense',
          modePaiement: 'comptant',
          montant: depenses,
          total: depenses,
          source: 'saisie_journaliere',
          commandeId: ficheRef.id,
          description: `Depenses declarees sur fiche papier du ${dateJournee}`,
        });
      }

      await batch.commit();
      toast.success("Journee enregistree sans stock manuel contradictoire", { id: toastId });
      setSaisies({});
      setDepenses(0);
      setRemisePatron(0);
      setAutresRecettes(0);
      setSoldePhysique(0);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center font-bold uppercase tracking-widest text-[#1E3A8A]">Chargement de la fiche...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF7A00]">
              <ClipboardList size={14} />
              Reprise fiche papier
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1E3A8A]">Saisie journaliere</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Les stocks de depart viennent de l'inventaire systeme. La fiche permet seulement de saisir les ventes, pertes et montants de caisse.
            </p>
          </div>

          <button
            onClick={enregistrerJournee}
            disabled={saving}
            className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#1E3A8A] px-7 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-800 disabled:opacity-50"
          >
            <Save size={18} />
            Enregistrer la journee
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ventes papier</p>
          <p className="mt-3 text-3xl font-black text-[#1E3A8A]">{totaux.ventes.toLocaleString()} XAF</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Articles sortis</p>
          <p className="mt-3 text-3xl font-black text-[#1E3A8A]">{totaux.sorties.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Solde calcule</p>
          <p className="mt-3 text-3xl font-black text-emerald-600">{soldeCalcule.toLocaleString()} XAF</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ecart caisse</p>
          <p className={`mt-3 text-3xl font-black ${ecartCaisse === 0 ? 'text-[#1E3A8A]' : 'text-[#FF7A00]'}`}>
            {ecartCaisse.toLocaleString()} XAF
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-blue-900/5 border border-slate-100">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Package className="text-[#1E3A8A]" size={22} />
              <h2 className="text-lg font-extrabold text-[#1E3A8A]">Produits de l'inventaire</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100 md:w-72"
                placeholder="Rechercher..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-5 py-4">Produit</th>
                  <th className="px-5 py-4 text-center">Stock systeme</th>
                  <th className="px-5 py-4 text-center">Vendu</th>
                  <th className="px-5 py-4 text-center">Perte</th>
                  <th className="px-5 py-4 text-center">Restant calcule</th>
                  <th className="px-5 py-4">Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produitsFiltres.map((produit) => {
                  const ligne = saisies[produit.id] || { vendu: 0, casse: 0, observation: '' };
                  const stockDepart = nombre(produit.stockTotal);
                  const sortie = nombre(ligne.vendu) + nombre(ligne.casse);
                  const restant = stockDepart - sortie;
                  const alerte = restant <= nombre(produit.stockAlerte);
                  const depasse = sortie > stockDepart;

                  return (
                    <tr key={produit.id} className="text-sm font-semibold text-slate-700">
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900">{produit.nom}</p>
                        <p className="mt-1 text-xs text-slate-400">{produit.categorie}</p>
                      </td>
                      <td className="px-5 py-4 text-center font-black text-[#1E3A8A]">{stockDepart}</td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={ligne.vendu}
                          onChange={(e) => setLigne(produit.id, 'vendu', e.target.value)}
                          className="mx-auto h-11 w-24 rounded-xl border border-slate-100 bg-slate-50 px-3 text-center font-black text-[#1E3A8A] outline-none focus:ring-4 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min="0"
                          value={ligne.casse}
                          onChange={(e) => setLigne(produit.id, 'casse', e.target.value)}
                          className="mx-auto h-11 w-24 rounded-xl border border-slate-100 bg-slate-50 px-3 text-center font-black text-[#1E3A8A] outline-none focus:ring-4 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex min-w-20 items-center justify-center rounded-lg px-3 py-2 font-black ${depasse ? 'bg-rose-50 text-rose-600' : alerte ? 'bg-orange-50 text-[#FF7A00]' : 'bg-emerald-50 text-emerald-700'}`}>
                          {restant}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          value={ligne.observation}
                          onChange={(e) => setLigne(produit.id, 'observation', e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100"
                          placeholder="Credit, casse, remarque..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-white p-6 shadow-xl shadow-blue-900/5 border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <Calculator className="text-[#FF7A00]" size={22} />
              <h2 className="font-extrabold text-[#1E3A8A]">Caisse papier</h2>
            </div>

            <div className="space-y-4">
              <Field label="Date" type="date" value={dateJournee} onChange={(v) => setDateJournee(String(v))} />
              <Field label="Vendeuse" value={vendeuse} onChange={(v) => setVendeuse(String(v))} />
              <Field label="Fond debut" value={fondDebut} onChange={(v) => setFondDebut(nombre(v))} />
              <Field label="Depenses" value={depenses} onChange={(v) => setDepenses(nombre(v))} />
              <Field label="Remise patron" value={remisePatron} onChange={(v) => setRemisePatron(nombre(v))} />
              <Field label="Autres recettes" value={autresRecettes} onChange={(v) => setAutresRecettes(nombre(v))} />
              <Field label="Solde physique" value={soldePhysique} onChange={(v) => setSoldePhysique(nombre(v))} />
            </div>
          </div>

          <div className={`rounded-2xl p-6 shadow-xl border ${ecartCaisse === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
            <div className="mb-3 flex items-center gap-3">
              {ecartCaisse === 0 ? <CheckCircle2 className="text-emerald-700" size={22} /> : <AlertTriangle className="text-[#FF7A00]" size={22} />}
              <h2 className={`font-extrabold ${ecartCaisse === 0 ? 'text-emerald-800' : 'text-orange-800'}`}>Controle</h2>
            </div>
            <p className="text-sm font-semibold leading-6 text-slate-600">
              Le stock de depart est verrouille sur l'inventaire. Les achats doivent etre saisis dans Achats Fournisseurs avant cette reprise.
            </p>
          </div>

          <div className="rounded-2xl bg-[#1E3A8A] p-6 text-white shadow-xl shadow-blue-900/10">
            <div className="mb-4 flex items-center gap-3">
              <Wallet className="text-orange-300" size={22} />
              <h2 className="font-extrabold">Resume</h2>
            </div>
            <Line label="Ventes" value={totaux.ventes} />
            <Line label="Recettes" value={totaux.ventes + autresRecettes} />
            <Line label="Charges" value={depenses + remisePatron} />
            <Line label="Solde calcule" value={soldeCalcule} />
          </div>
        </aside>
      </section>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'number' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 px-4 font-bold text-[#1E3A8A] outline-none focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

const Line = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between border-t border-white/10 py-3 text-sm font-bold">
    <span className="text-blue-100/70">{label}</span>
    <span>{value.toLocaleString()} XAF</span>
  </div>
);

export default SaisieJournaliere;
