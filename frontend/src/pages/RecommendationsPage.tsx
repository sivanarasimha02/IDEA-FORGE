import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Filter, ArrowRight } from 'lucide-react';
import { AgronomicRecommendation } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface RecommendationsPageProps {
  recommendations: AgronomicRecommendation[];
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ recommendations }) => {
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = recommendations.filter((r) => {
    if (priorityFilter === 'all') return true;
    return r.priority.toLowerCase() === priorityFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Mitigation Actions & Agronomic Guidance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Prioritized preventive interventions tailored to crop growth stage and detected micro-climatic stress</p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${priorityFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All ({recommendations.length})
          </button>
          <button
            onClick={() => setPriorityFilter('urgent')}
            className={`px-2.5 py-1 rounded-md transition-colors ${priorityFilter === 'urgent' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Urgent
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`px-2.5 py-1 rounded-md transition-colors ${priorityFilter === 'high' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            High
          </button>
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            No recommendations matching this priority filter.
          </div>
        ) : (
          filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{rec.category}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{rec.title}</h3>
                  </div>
                </div>
                <StatusBadge status={rec.priority} />
              </div>

              {/* Action Plan */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Prescribed Field Action:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{rec.action}</p>
              </div>

              {/* Rationale & Evidence */}
              <div className="text-xs text-slate-400 space-y-1">
                <span className="text-slate-300 font-semibold">Agronomic Rationale: </span>
                <span>{rec.rationale}</span>
              </div>

              {/* Mandatory Disclaimer */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 italic flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>{rec.disclaimer}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
