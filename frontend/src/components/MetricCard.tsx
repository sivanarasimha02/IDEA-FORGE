import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  alertLevel?: 'none' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  alertLevel = 'none'
}) => {
  let border = 'border-slate-800 hover:border-slate-700';
  let glow = '';

  if (alertLevel === 'danger') {
    border = 'border-rose-500/40';
    glow = 'shadow-[0_0_15px_rgba(244,63,94,0.15)]';
  } else if (alertLevel === 'warning') {
    border = 'border-amber-500/40';
    glow = 'shadow-[0_0_15px_rgba(245,158,11,0.15)]';
  } else if (alertLevel === 'success') {
    border = 'border-emerald-500/40';
    glow = 'shadow-[0_0_15px_rgba(16,185,129,0.15)]';
  }

  return (
    <div className={`bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border ${border} ${glow} transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-800/80 text-emerald-400 border border-slate-700/50">
            {icon}
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</h4>
            <div className="text-2xl font-bold text-white mt-0.5 tracking-tight">{value}</div>
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-800/70 text-xs text-slate-400 flex items-center justify-between">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
