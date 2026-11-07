import React, { useState } from 'react';
import { 
  Smartphone, Monitor, Tablet, RotateCcw, 
  Wifi, Battery, Signal, Zap, Play, Info,
  Smartphone as PhoneIcon, Layout, Monitor as ScreenIcon
} from 'lucide-react';

const SimulateurTablette = () => {
  const [url, setUrl] = useState(window.location.origin);
  const [device, setDevice] = useState<'tablet' | 'mobile' | 'desktop'>('tablet');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [role, setRole] = useState('caissier');

  const devices = {
    tablet: { width: orientation === 'landscape' ? 1024 : 768, height: orientation === 'landscape' ? 768 : 1024, label: 'Tablette Pro' },
    mobile: { width: orientation === 'landscape' ? 844 : 390, height: orientation === 'landscape' ? 390 : 844, label: 'Smartphone' },
    desktop: { width: '100%', height: 800, label: 'Poste Fixe' }
  };

  return (
    <div className="p-10 space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
          <div>
            <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight uppercase leading-none mb-3">Laboratoire de Simulation</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Testez GestCave Pro en conditions réelles</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <button 
                onClick={() => setDevice('mobile')}
                className={`h-12 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${device === 'mobile' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
             >
                <PhoneIcon size={16} /> Mobile
             </button>
             <button 
                onClick={() => setDevice('tablet')}
                className={`h-12 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${device === 'tablet' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
             >
                <Tablet size={16} /> Tablette
             </button>
             <button 
                onClick={() => setDevice('desktop')}
                className={`h-12 px-6 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${device === 'desktop' ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
             >
                <ScreenIcon size={16} /> Desktop
             </button>
             <div className="w-px h-12 bg-slate-100 mx-2" />
             <button 
                onClick={() => setOrientation(o => o === 'landscape' ? 'portrait' : 'landscape')}
                className="h-12 px-6 bg-orange-50 text-[#FF7A00] rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-100 transition-all"
             >
                <RotateCcw size={16} /> Pivoter
             </button>
          </div>
        </div>

        <div className="bg-[#0F172A] rounded-[3.5rem] p-12 flex flex-col items-center justify-center relative overflow-hidden min-h-[900px] border-[12px] border-[#1E293B] shadow-2xl">
          {/* Status Bar Mock */}
          <div className="absolute top-0 left-0 w-full h-8 px-10 flex justify-between items-center text-white/30 font-black text-[10px] z-20">
             <div className="flex items-center gap-4">
                <span>GESTCAVE SIMULATOR v1.0</span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
                  <div className="w-1 h-3 bg-white/20 rounded-full" />
                  <div className="w-1 h-3 bg-white/40 rounded-full" />
                </div>
             </div>
             <div className="flex items-center gap-4">
                <Wifi size={12} />
                <Signal size={12} />
                <div className="flex items-center gap-1">
                  <span>94%</span>
                  <Battery size={12} />
                </div>
                <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
          </div>

          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500 relative z-10"
            style={{ 
              width: typeof devices[device].width === 'string' ? devices[device].width : `${devices[device].width}px`, 
              height: `${devices[device].height}px`,
              maxWidth: '100%'
            }}
          >
            <iframe 
              src={url} 
              className="w-full h-full border-none"
              title="Simulation Device"
            />
          </div>

          {/* Device Hardware Mock Elements */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full" />
          
          <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute -top-10 -left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex gap-6 items-start">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><Info size={24} /></div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A] uppercase mb-2">Simulation Tactile</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">L'interface s'adapte automatiquement au format tablette (KDS, POS) pour tester l'ergonomie.</p>
              </div>
           </div>
           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex gap-6 items-start">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><Zap size={24} /></div>
              <div>
                <h4 className="text-sm font-black text-[#1E3A8A] uppercase mb-2">Tests de Performance</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Vérifiez la fluidité des animations et le temps de réponse des commandes.</p>
              </div>
           </div>
           <div className="p-8 bg-[#1E3A8A] rounded-[2.5rem] text-white flex gap-6 items-start shadow-xl shadow-blue-900/20">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#FF7A00] shadow-sm"><Play size={24} /></div>
              <div>
                <h4 className="text-sm font-black uppercase mb-2">Instructions</h4>
                <p className="text-xs text-blue-100/60 leading-relaxed font-medium">Connectez-vous avec un PIN employé dans la tablette pour simuler un service réel.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SimulateurTablette;
