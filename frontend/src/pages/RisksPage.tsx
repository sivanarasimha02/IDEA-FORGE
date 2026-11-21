import React from 'react';
import { AlertTriangle, ShieldCheck, Info, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { RiskSummary, ClimateRisk } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface RisksPageProps {
  risks: RiskSummary | null;
}

export const RisksPage: React.FC<RisksPageProps> = ({ risks }) => {
  if (!risks) {
    return <div className="p-8 text-center text-slate-400">Loading risk predictions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Climate Risk Prediction Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">Calibrated probabilistic forecasting using Gradient Boosting, Random Forests, and agrometeorological rules</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Status: <strong className="text-emerald-400">{risks.overall_status}</strong>
        </div>
      </div>

      {/* Grid of Risk Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {risks.risks.map((risk) => {
          const probPct = Math.round(risk.calibrated_score * 100);
          return (
            <div
              key={risk.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white capitalize">
                        {risk.risk_type.replace('_', ' ')}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">Prediction Horizon: {risk.horizon_days} Days</p>
                    </div>
                  </div>
                  <StatusBadge status={risk.category} />
                </div>

                {/* Score & Progress Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Calibrated Risk Score</span>
                    <span className="text-lg font-bold text-white font-mono">{probPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                    <div
                      className={`h-full transition-all duration-500 ${
                        risk.category === 'Critical' ? 'bg-rose-500' :
                        risk.category === 'High' ? 'bg-orange-500' :
                        risk.category === 'Moderate' ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, probPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Model Uncertainty: ±{risk.uncertainty_pct}%</span>
                    <span>Version: {risk.model_version}</span>
                  </div>
                </div>

                {/* Contributing Factors */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block">
                    Key Contributing Factors (Feature Impact)
                  </span>
                  <div className="space-y-1.5">
                    {risk.contributing_factors.map((factor, i) => (
                      <div key={i} className="flex items-start justify-between text-xs p-2 rounded-lg bg-slate-850 border border-slate-800">
                        <div className="flex items-start space-x-2">
                          {factor.impact === 'negative' ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-200">{factor.name}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{factor.detail}</p>
                          </div>
                        </div>
                        {factor.value && (
                          <span className="font-mono text-[11px] text-slate-300 ml-2 whitespace-nowrap">{factor.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Evaluated: {risk.created_at.slice(0, 10)}</span>
                <span className="text-emerald-400">Validated Scikit-Learn Model</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
