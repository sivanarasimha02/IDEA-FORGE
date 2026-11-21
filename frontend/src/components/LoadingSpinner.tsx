import React from 'react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Synthesizing Agrometeorological Data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-xs text-emerald-400 font-mono">
          AI
        </div>
      </div>
      <p className="text-xs text-slate-400 font-mono tracking-wide animate-pulse">{label}</p>
    </div>
  );
};
