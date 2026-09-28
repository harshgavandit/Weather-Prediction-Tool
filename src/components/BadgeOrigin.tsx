import React from 'react';
import { Database, Calculator, Sparkles, UserCheck, FlaskConical } from 'lucide-react';
import { ProvenanceType } from '../types';

interface BadgeOriginProps {
  type: ProvenanceType;
  citation?: string;
  className?: string;
}

export const BadgeOrigin: React.FC<BadgeOriginProps> = ({ type, citation, className = '' }) => {
  switch (type) {
    case 'source':
      return (
        <span
          title={citation || 'Directly extracted from RESPONSES.pdf (Page 1)'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        >
          <Database className="w-3 h-3 text-emerald-400" />
          <span>Source Data</span>
          {citation && <span className="opacity-75 text-[10px] font-mono">({citation})</span>}
        </span>
      );

    case 'calculated':
      return (
        <span
          title="Derived via exact statistical calculations / mathematical cross-tabulation"
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 ${className}`}
        >
          <Calculator className="w-3 h-3 text-purple-400" />
          <span>Calculated Metric</span>
        </span>
      );

    case 'ai':
      return (
        <span
          title="Plain-language interpretation derived from the supplied PDF survey"
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 ${className}`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Analyst Interpretation</span>
        </span>
      );

    case 'citizen':
      return (
        <span
          title="Direct individual respondent observation from field survey"
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 ${className}`}
        >
          <UserCheck className="w-3 h-3 text-blue-400" />
          <span>Citizen Observation</span>
        </span>
      );

    case 'scenario':
      return (
        <span title="Conditional scenario for planning; not a prediction" className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 ${className}`}>
          <FlaskConical className="w-3 h-3" /><span>Conditional Scenario</span>
        </span>
      );

    default:
      return null;
  }
};
