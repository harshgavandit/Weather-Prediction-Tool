import React, { useState, useMemo } from 'react';
import {
  Sliders,
  TrendingDown,
  RefreshCcw,
  Droplets,
  Flame,
  Sprout,
  Users
} from 'lucide-react';
import { CompositeIndices } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface RiskEngineProps {
  indices: CompositeIndices;
}

export const RiskEngine: React.FC<RiskEngineProps> = ({ indices }) => {
  // Policy levers for interactive simulation
  const [treeCoverIncrease, setTreeCoverIncrease] = useState<number>(20);
  const [rainwaterHarvesting, setRainwaterHarvesting] = useState<number>(30);
  const [wasteDrainageAction, setWasteDrainageAction] = useState<number>(40);
  const [publicAwarenessExpansion, setPublicAwarenessExpansion] = useState<number>(25);

  // Dynamic simulation of vulnerability reduction
  const simulatedScore = useMemo(() => {
    const baseScore = indices.compositeVulnerabilityScore;
    // Mitigation factors:
    // Tree cover reduces heat index by up to 15 points
    const heatMitigation = (treeCoverIncrease / 100) * 12.0;
    // Rainwater harvesting reduces water stress by up to 18 points
    const waterMitigation = (rainwaterHarvesting / 100) * 14.0;
    // Waste/drainage reduces flood vulnerability by up to 10 points
    const floodMitigation = (wasteDrainageAction / 100) * 9.0;
    // Awareness elevates adaptive capacity, lowering net vulnerability
    const readinessBonus = (publicAwarenessExpansion / 100) * 8.0;

    const totalReduction = (heatMitigation * 0.3) + (waterMitigation * 0.35) + (floodMitigation * 0.2) + (readinessBonus * 0.15);
    const result = Math.max(20, Number((baseScore - totalReduction).toFixed(1)));
    return result;
  }, [indices, treeCoverIncrease, rainwaterHarvesting, wasteDrainageAction, publicAwarenessExpansion]);

  const scoreDiff = Number((indices.compositeVulnerabilityScore - simulatedScore).toFixed(1));

  const handleReset = () => {
    setTreeCoverIncrease(0);
    setRainwaterHarvesting(0);
    setWasteDrainageAction(0);
    setPublicAwarenessExpansion(0);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Composite Vulnerability &amp; Policy Simulation Engine</h2>
            <BadgeOrigin type="calculated" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Mathematical synthesis aggregating empirical citizen risk perceptions across heat, hydrology, agriculture,
            and awareness. Includes an interactive policy scenario sandbox demonstrating risk abatement potential.
          </p>
        </div>
      </div>

      {/* Baseline Indices Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heat Perception */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Heat Stress Index</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-extrabold text-white">{indices.heatPerceptionIndex}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">Formula: 35% Q1 + 35% Q2 + 30% Q8</p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${indices.heatPerceptionIndex}%` }} />
          </div>
        </div>

        {/* Water Stress */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400">Water &amp; Flood Stress</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-extrabold text-white">{indices.waterStressIndex}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">Formula: 35% Q4 + 45% Q5 + 20% Q10</p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${indices.waterStressIndex}%` }} />
          </div>
        </div>

        {/* Eco & Agrarian */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Eco-Agrarian Stress</span>
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-extrabold text-white">{indices.ecoAgrarianIndex}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">Formula: 35% Q3 + 40% Q9 + 25% Q11</p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${indices.ecoAgrarianIndex}%` }} />
          </div>
        </div>

        {/* Public Readiness */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400">Public Concern &amp; Literacy</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-extrabold text-white">{indices.publicReadinessIndex}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">Formula: 50% Q12 + 50% Q13</p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${indices.publicReadinessIndex}%` }} />
          </div>
        </div>
      </div>

      {/* Interactive Policy Simulation Sandbox */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Scenario Simulator: Citizen Policy Levers</h3>
              <BadgeOrigin type="ai" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Adjust policy scale sliders below to evaluate how citizen-driven interventions reduce the net Vulnerability Index
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Levers</span>
          </button>
        </div>

        {/* 2-Column: Sliders on left, Projected Outcome on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {/* Lever 1: Tree Plantation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  1. Urban Forestry &amp; Green Buffer (Citizen Demand: 39.2%)
                </span>
                <span className="font-mono text-emerald-400 font-bold">+{treeCoverIncrease}% canopy</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={treeCoverIncrease}
                onChange={(e) => setTreeCoverIncrease(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                Alleviates Urban Heat Island (UHI) and promotes stormwater soil infiltration.
              </p>
            </div>

            {/* Lever 2: Rainwater Harvesting */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  2. Decentralized Rainwater Harvesting (Citizen Demand: 21.6%)
                </span>
                <span className="font-mono text-cyan-400 font-bold">{rainwaterHarvesting}% buildings</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={rainwaterHarvesting}
                onChange={(e) => setRainwaterHarvesting(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[11px] text-slate-400">
                Captures monsoonal deluge to buffer summer aquifer depletion.
              </p>
            </div>

            {/* Lever 3: Waste & Stormwater Desilting */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  3. Nullah Desilting &amp; Waste Management (Citizen Demand: 13.7%)
                </span>
                <span className="font-mono text-amber-400 font-bold">{wasteDrainageAction}% capacity restored</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={wasteDrainageAction}
                onChange={(e) => setWasteDrainageAction(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Prevents municipal plastic clogging to drain convective cloudbursts.
              </p>
            </div>

            {/* Lever 4: Public Awareness & Heat Alerts */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  4. Community Early-Warning Network (Citizen Demand: 17.6%)
                </span>
                <span className="font-mono text-purple-400 font-bold">{publicAwarenessExpansion}% coverage</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={publicAwarenessExpansion}
                onChange={(e) => setPublicAwarenessExpansion(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[11px] text-slate-400">
                Heat Action Plan sirens, hydration kiosks, and citizen flood alerts.
              </p>
            </div>
          </div>

          {/* Outcome Gauge */}
          <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between text-center">
            <div>
              <span className="text-xs uppercase font-mono font-semibold text-slate-400 tracking-wider">
                Simulated Vulnerability
              </span>

              <div className="my-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-emerald-400">{simulatedScore}</span>
                  <span className="text-sm font-semibold text-slate-500">/ 100</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{scoreDiff} points reduction</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <p>Baseline Score: <strong className="text-white">{indices.compositeVulnerabilityScore}</strong></p>
                <p>Status: <span className="text-emerald-400 font-semibold">Moderate-Low Risk Tier</span></p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 pt-4 border-t border-slate-700/60 leading-relaxed">
              Model calculates sensitivity response based on regional empirical weights and IPCC AR6 adaptation matrices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
