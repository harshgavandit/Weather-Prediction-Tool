import React from 'react';
import {
  TreePine,
  Droplets,
  Megaphone,
  Trash2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { BadgeOrigin } from './BadgeOrigin';

export const RecommendationsRoadmap: React.FC = () => {
  const roadmaps = [
    {
      rank: '01',
      title: 'Urban Micro-Forestry & Green Corridors',
      citizenSupport: '39.2% (20 Votes)',
      icon: TreePine,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      timeline: 'Immediate (Months 1–6)',
      objective: 'Counteract Urban Heat Island (UHI) effect and restore natural rainwater percolation.',
      actionItems: [
        'Miyawaki dense native forest clusters in degraded urban plots and school grounds',
        'Mandatory 30% vegetative cover for all new residential and commercial permits',
        'Avenue tree plantation with drought-resilient and shade-intensive native species (Peepal, Neem, Banyan)'
      ],
      targetAudience: 'Municipal Corporations, Housing Societies, Citizen Groups'
    },
    {
      rank: '02',
      title: 'Decentralized Rainwater Harvesting (RWH) & Aquifer Recharge',
      citizenSupport: '21.6% (11 Votes)',
      icon: Droplets,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      timeline: 'Pre-Monsoon (Annual Q1)',
      objective: 'Resolve the paradox of summer water shortages following monsoonal inundation.',
      actionItems: [
        'Property tax rebates for apartment complexes achieving 100% roof runoff harvesting',
        'Installation of deep percolation bore-wells along storm drains to recharge unconfined aquifers',
        'Revival and desilting of heritage village ponds and community wells in peri-urban belts'
      ],
      targetAudience: 'Water Supply Boards, Resident Welfare Associations, Panchayats'
    },
    {
      rank: '03',
      title: 'Heat Action Early Warning & Climate Literacy Networks',
      citizenSupport: '17.6% (9 Votes)',
      icon: Megaphone,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      timeline: 'Continuous & Summer Peak',
      objective: 'Protect vulnerable outdoor laborers and children from heat-related morbidity.',
      actionItems: [
        'Tiered color-coded Heat Action Plan (HAP) sirens linked to real-time wet-bulb temperature thresholds',
        'Public hydration kiosks and shaded recovery transit shelters in dense transit nodes',
        'School and college climate literacy curriculum explaining regional weather adaptations'
      ],
      targetAudience: 'Public Health Department, Education Institutes, NGOs'
    },
    {
      rank: '04',
      title: 'Stormwater Nullah Desilting & Plastic Interceptors',
      citizenSupport: '13.7% (7 Votes)',
      icon: Trash2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      timeline: 'Annual Pre-Monsoon (March–May)',
      objective: 'Eliminate recurrent monsoon street waterlogging and suburban transit shutdowns.',
      actionItems: [
        'Full acoustic and hydraulic desilting of arterial drainage channels completed by May 31',
        'Deployment of floating plastic trash-traps at estuary and creek outlets to prevent tidal backflow',
        'Automated real-time water-level sensors on railway underpasses with automated traffic diversion gates'
      ],
      targetAudience: 'Stormwater Drain Engineers, Railways, Highway Authorities'
    },
    {
      rank: '05',
      title: 'Rooftop Solar & Decarbonized Microgrids',
      citizenSupport: '7.8% (4 Votes)',
      icon: Zap,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      timeline: 'Multi-Year Infrastructure',
      objective: 'Reduce thermal emissions, cut energy costs, and maintain blackout resilience.',
      actionItems: [
        'Grid-connected rooftop solar subsidies for cooperative housing societies and small businesses',
        'Solar-powered emergency pumping stations for storm flood operations during grid failure',
        'Transition of municipal utility vehicles and public bus fleet to 100% electric propulsion'
      ],
      targetAudience: 'Energy Distribution Companies, Urban Planners, Transport Operators'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Actionable Climate Resilience Roadmap</h2>
            <BadgeOrigin type="source" citation="RESPONSES.pdf, Question 15" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            A practical policy and engineering roadmap directly translating citizen priorities into prioritized interventions.
            Ranked in strict accordance with citizen consensus from the ground survey.
          </p>
        </div>
      </div>

      {/* Roadmap Cards */}
      <div className="space-y-4">
        {roadmaps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.rank}
              className={`rounded-2xl bg-slate-900 border ${item.borderColor} p-6 space-y-4 shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-2xl font-black text-slate-600">{item.rank}</span>
                  <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">Citizen Consensus:</span>
                      <span className={`text-xs font-semibold ${item.color}`}>{item.citizenSupport}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
                    {item.timeline}
                  </span>
                </div>
              </div>

              {/* Objective */}
              <div className="text-xs text-slate-300">
                <strong className="text-white">Core Objective: </strong> {item.objective}
              </div>

              {/* Action items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {item.actionItems.map((act, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${item.color}`} />
                    <span className="leading-relaxed">{act}</span>
                  </div>
                ))}
              </div>

              {/* Stakeholders */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-slate-300">Key Implementers:</span>
                <span>{item.targetAudience}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
