import React, { useState } from 'react';
import {
  Droplets,
  ThermometerSun,
  Sprout,
  Building2,
  Wind,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { SectoralImpactsData } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface SectoralImpactsProps {
  sectorData: SectoralImpactsData;
}

export const SectoralImpacts: React.FC<SectoralImpactsProps> = ({ sectorData }) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string>('water');

  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Droplets': return Droplets;
      case 'ThermometerSun': return ThermometerSun;
      case 'Sprout': return Sprout;
      case 'Building2': return Building2;
      case 'Wind': return Wind;
      default: return ShieldAlert;
    }
  };

  const selectedSector = sectorData.sectors.find(s => s.id === selectedSectorId) || sectorData.sectors[0];
  const SelectedIcon = getSectorIcon(selectedSector.icon);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Survey-Based Sector Priorities &amp; Possible Effects</h2>
            <BadgeOrigin type="ai" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            An educational synthesis of 51 responses from <code>RESPONSES.pdf</code>. Scores summarize related survey answers;
            they are not hazard probabilities, official ratings, or site-specific forecasts.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          Framework: transparent survey priority index
        </div>
      </div>

      {/* Sector Navigation Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {sectorData.sectors.map((s) => {
          const Icon = getSectorIcon(s.icon);
          const isSelected = selectedSectorId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSectorId(s.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  s.riskScore >= 80 ? 'bg-rose-500/20 text-rose-300' :
                  s.riskScore >= 70 ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  Priority {s.riskScore}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-white truncate">{s.sector.split('&')[0]}</p>
                <p className="text-[11px] text-slate-400 truncate">{s.riskLevel}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Sector Detailed Dossier */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <SelectedIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{selectedSector.sector}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  selectedSector.riskScore >= 80 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  selectedSector.riskScore >= 70 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {selectedSector.riskLevel} ({selectedSector.riskScore}/100)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Survey-derived priority with conditional analyst interpretation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BadgeOrigin type="source" citation="RESPONSES.pdf, Page 1" />
            <BadgeOrigin type="ai" />
          </div>
        </div>

        {/* 2-Column Assessment Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ground Survey Evidence */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              <span>Ground Survey Telemetry (RESPONSES.pdf)</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedSector.surveyEvidence}
            </p>
          </div>

          {/* Meteorological Basis */}
          <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Bounded interpretation</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedSector.scientificBasis}
            </p>
          </div>
        </div>

        {/* Projected Real-World Risks */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Possible effects to investigate · not predictions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedSector.projectedRisks.map((risk, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-rose-200/90 leading-relaxed">
                <span className="font-mono text-rose-400 font-bold block mb-1">0{idx + 1}.</span>
                {risk}
              </div>
            ))}
          </div>
          <div className="pt-1"><BadgeOrigin type="scenario" /></div>
        </div>

        {/* Policy & Practical Engineering Interventions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Recommended Strategic &amp; Practical Interventions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedSector.interventions.map((intervention, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 leading-relaxed">
                <span className="font-mono text-cyan-400 font-bold block mb-1">Action 0{idx + 1}:</span>
                {intervention}
              </div>
            ))}
          </div>
        </div>

        {/* Citizen Alignment Callout */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-emerald-300">Direct Citizen Consensus Alignment: </span>
            <span className="text-slate-300 leading-relaxed">{selectedSector.surveyRecommendationAlignment}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
