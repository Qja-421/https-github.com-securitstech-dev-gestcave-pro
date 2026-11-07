import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // Pourcentage
  trendLabel?: string;
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'default';
  suffix?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendLabel = "vs mois précédent",
  variant = 'default',
  suffix
}: StatCardProps) => {
  
  const getTrendColor = () => {
    if (trend === undefined) return '';
    if (trend > 0) return 'text-success bg-success-light border-success/20';
    if (trend < 0) return 'text-danger bg-danger-light border-danger/20';
    return 'text-text-muted bg-surface-3 border-subtle';
  };

  const TrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <ArrowUpRight size={14} />;
    if (trend < 0) return <ArrowDownRight size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className={`stat-card ${variant}`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
          ${variant === 'primary' ? 'bg-brand-light text-brand' : 
            variant === 'accent' ? 'bg-accent-light text-accent' : 
            variant === 'success' ? 'bg-success-light text-success' : 
            variant === 'danger' ? 'bg-danger-light text-danger' : 
            'bg-surface-3 text-text-secondary'}`}
        >
          {icon}
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${getTrendColor()}`}>
            <TrendIcon />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-extrabold text-text-primary tracking-tight">{value}</p>
          {suffix && <span className="text-sm font-bold text-text-muted">{suffix}</span>}
        </div>
        
        {trend !== undefined && (
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mt-2">
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
};
