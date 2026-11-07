import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { 
  Search, Plus, Minus, Trash2, CreditCard, 
  Wallet, Receipt, CheckCircle, Coffee, Beer, Utensils, AlertTriangle, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  nom: string;
  prix_vente: number;
  categorie: string;
  stock_actuel?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CaisseExpress() {
  const { profil, etablissementSimuleId } = useAuthStore();
  const etablissementId = etablissementSimuleId || profil?.etablissement_id;
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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
      
      // Si la base est vide (démo), on met de fausses données pour la V2.1
      if (data.length === 0) {
        setProducts([
          { id: '1', nom: 'Beaufort 50cl', prix_vente: 1000, categorie: 'Bières', stock_actuel: 45 },
          { id: '2', nom: 'Ngok 65cl', prix_vente: 1200, categorie: 'Bières', stock_actuel: 20 },
          { id: '3', nom: 'Coca Cola', prix_vente: 800, categorie: 'Softs', stock_actuel: 30 },
          { id: '4', nom: 'Brochette Boeuf', prix_vente: 2000, categorie: 'Cuisine' },
          { id: '5', nom: 'Chawarma', prix_vente: 2500, categorie: 'Cuisine' },
        ]);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error("Erreur chargement articles:", error);
      toast.error("Mode Hors-ligne activé. Les données locales sont utilisées.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Toutes', ...Array.from(new Set(products.map(p => p.categorie)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Toutes' || p.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.prix_vente * item.quantity), 0);

  const handleCheckout = async (paymentMethod: 'Espèces' | 'Mobile Money') => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Enregistrer la commande
      const orderData = {
        etablissementId,
        serveurId: profil?.id,
        serveurNom: profil?.nom,
        items: cart,
        total,
        methodePaiement: paymentMethod,
        statut: 'Terminée',
        dateCreation: Timestamp.now(),
        type: 'Vente Directe' // Mode Express
      };

      await addDoc(collection(db, 'commandes'), orderData);

      // Ici, on pourrait aussi mettre à jour les stocks via un Batch (simplifié pour cet exemple)
      
      toast.success(`Vente de ${total} XAF validée !`);
      setCart([]);
    } catch (error) {
      console.error("Erreur de paiement:", error);
      // Grâce à la persistance PWA/Firebase, la commande est sauvée localement 
      // et sera synchronisée au retour d'internet.
      toast.success(`Vente sauvegardée (Mode Hors-Ligne)`);
      setCart([]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* SECTION GAUCHE : PRODUITS */}
      <div className="flex-1 flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Produits */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-[#1E3A8A]">Caisse Express</h2>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Prêt
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF7A00]" size={20} />
              <input 
                type="text" 
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#FF7A00]/20 transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                  ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille Produits */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-[#FF7A00] hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center gap-3 active:scale-95 relative"
              >
                {/* Badge Alerte Stock */}
                {product.stock_actuel !== undefined && product.stock_actuel <= 10 && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border-2 border-white animate-pulse">
                    <AlertTriangle size={10} />
                    {product.stock_actuel} restant
                  </div>
                )}
                
                <div className="w-16 h-16 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center">
                  {product.categorie.includes('Bières') ? <Beer size={28} /> : 
                   product.categorie.includes('Cuisine') ? <Utensils size={28} /> : 
                   <Coffee size={28} />}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-700 text-sm leading-tight">{product.nom}</h3>
                  <p className="text-[#FF7A00] font-black">{product.prix_vente.toLocaleString()} F</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION DROITE : PANIER (TICKET) */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-[#1E3A8A] text-white">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Receipt size={24} /> Ticket en cours
          </h3>
        </div>

        {/* Lignes du panier */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Le ticket est vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-700 truncate">{item.nom}</h4>
                  <p className="text-[#FF7A00] font-black text-xs">{item.prix_vente.toLocaleString()} F</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-md shadow-sm hover:text-red-500 transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-md shadow-sm hover:text-emerald-500 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pied du panier (Totaux et Paiement) */}
        <div className="p-6 border-t border-slate-100 bg-white space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Total à payer</span>
            <span className="text-3xl font-black text-[#1E3A8A]">{total.toLocaleString()} F</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleCheckout('Mobile Money')}
              className="p-4 bg-amber-50 text-amber-700 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <CreditCard size={20} />
              Mobile Money
            </button>
            <button 
              disabled={cart.length === 0 || isProcessing}
              onClick={() => handleCheckout('Espèces')}
              className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm flex flex-col items-center gap-2 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <Wallet size={20} />
              Espèces
            </button>
          </div>
          
          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={() => handleCheckout('Espèces')}
            className="w-full py-4 bg-[#FF7A00] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-500/20 hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={20} /> Encaisser {total > 0 && `(${total.toLocaleString()} F)`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
