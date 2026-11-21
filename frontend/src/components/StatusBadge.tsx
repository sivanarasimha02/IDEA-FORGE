import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toLowerCase();
  let colorStyles = 'bg-slate-700 text-slate-300 border-slate-600';

  if (s.includes('low') || s.includes('optimal') || s.includes('good') || s.includes('excellent')) {
    colorStyles = 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
  } else if (s.includes('mod') || s.includes('medium')) {
    colorStyles = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
  } else if (s.includes('high')) {
    colorStyles = 'bg-orange-950/80 text-orange-400 border-orange-500/40';
  } else if (s.includes('crit') || s.includes('urgent') || s.includes('danger') || s.includes('poor')) {
    colorStyles = 'bg-rose-950/80 text-rose-300 border-rose-500/50';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${colorStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
