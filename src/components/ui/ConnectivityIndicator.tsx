import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { usePOSStore } from '../../store/posStore';

const ConnectivityIndicator = () => {
  const { isOnline } = usePOSStore();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-[#FF7A00] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-md">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center animate-pulse">
           <WifiOff size={20} />
        </div>
        <div>
           <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Mode Hors-Ligne Actif</p>
           <p className="text-[10px] font-bold text-white/70 uppercase tracking-tight">Vos données seront synchronisées dès le retour d'internet.</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityIndicator;
