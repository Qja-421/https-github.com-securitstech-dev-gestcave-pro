import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Info, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Link } from 'react-router-dom';

export const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    notificationsNonLues, 
    marquerLue, 
    marquerToutesLues,
    supprimerNotification
  } = useUIStore();

  const count = notificationsNonLues();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info size={16} className="text-info" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning" />;
      case 'error': return <ShieldAlert size={16} className="text-danger" />;
      case 'success': return <CheckCircle size={16} className="text-success" />;
      default: return <Bell size={16} className="text-text-muted" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-full transition-all"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white border-2 border-surface">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="p-4 border-b border-subtle flex items-center justify-between bg-surface-2">
            <h3 className="font-extrabold text-text-primary">Notifications</h3>
            {count > 0 && (
              <button 
                onClick={marquerToutesLues}
                className="text-xs font-bold text-brand hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-20" />
                <p className="text-sm font-medium">Aucune notification pour le moment</p>
              </div>
            ) : (
              <div className="divide-y divide-subtle">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 flex gap-4 transition-all hover:bg-surface-2 ${!n.lue ? 'bg-brand-light/30' : ''}`}
                    onClick={() => !n.lue && marquerLue(n.id)}
                  >
                    <div className="shrink-0 mt-1">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!n.lue ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}>
                        {n.titre}
                      </p>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                          {new Date(n.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        
                        <div className="flex gap-2">
                          {n.action && (
                            <Link 
                              to={n.action.path}
                              className="text-[10px] font-bold text-brand hover:underline uppercase"
                            >
                              {n.action.label}
                            </Link>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); supprimerNotification(n.id); }}
                            className="text-text-muted hover:text-danger p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
