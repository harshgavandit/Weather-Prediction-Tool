import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Flame,
  Lightbulb
} from 'lucide-react';
import { SurveyResponseData } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface SurveyAnalyticsProps {
  surveyData: SurveyResponseData;
}

const PROBLEM_COLORS: Record<string, string> = {
  'Heat': '#f43f5e',
  'Water Shortage': '#0284c7',
  'Flooding': '#06b6d4',
  'Rainfall changes': '#f59e0b',
  'Air Pollution': '#8b5cf6',
  'Other': '#64748b'
};

const ACTION_COLORS: Record<string, string> = {
  'Tree Plantation': '#10b981',
  'Water Conservation': '#0284c7',
  'Public Awareness': '#8b5cf6',
  'Waste Management': '#f59e0b',
  'Renewable Energy': '#06b6d4'
};

export const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveyData }) => {
  const { analytics } = surveyData;
  const questions = analytics.questions;

  // Chart data for Biggest Problem (Q14)
  const problemData = questions.Q14?.distribution.map(d => ({
    name: d.option,
    count: d.count,
    percentage: d.percentage,
    fill: PROBLEM_COLORS[d.option] || '#64748b'
  })) || [];

  // Chart data for Recommended Action (Q15)
  const actionData = questions.Q15?.distribution.map(d => ({
    name: d.option,
    count: d.count,
    percentage: d.percentage,
    fill: ACTION_COLORS[d.option] || '#10b981'
  })) || [];

  // Chart data for Concern (Q12)
  const concernData = questions.Q12?.distribution.map(d => ({
    name: d.option,
    count: d.count,
    percentage: d.percentage
  })) || [];

  return (
    <div className="space-y-8">
      {/* Title Bar */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Citizen Survey Quantitative Analytics</h2>
            <BadgeOrigin type="source" citation="RESPONSES.pdf, Questions 1–15" />
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Detailed statistical frequency distributions and cross-correlations across all 15 survey questions,
            grounded in 51 verified field responses. Calculations reflect exact arithmetic counts without estimation.
          </p>
        </div>
      </div>

      {/* Row 1: Priority Dilemmas - Biggest Problem & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biggest Problem (Q14) */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold tracking-wider">
                  Question 14 Priority
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Biggest Climate-Related Problem
                </h3>
              </div>
              <BadgeOrigin type="source" citation="Q14, Page 1" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              "What do you think is the biggest climate-related problem in your area?"
            </p>

            {/* Donut Chart */}
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={problemData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    labelLine={false}
                  >
                    {problemData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} votes (${item.payload.percentage}%)`,
                      item.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-800">
            {problemData.map(p => (
              <div key={p.name} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                  <span className="text-xs text-slate-300 font-medium truncate">{p.name}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">{p.count}</span>
                  <span className="text-xs font-mono text-slate-400">{p.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions (Q15) */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                  Question 15 Consensus
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Citizen Recommended Action Priorities
                </h3>
              </div>
              <BadgeOrigin type="source" citation="Q15, Page 1" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              "What actions should be taken to reduce the impact of climate change in your area?"
            </p>

            {/* Horizontal Bar Chart */}
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} responses (${item.payload.percentage}%)`,
                      'Priority Votes'
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {actionData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insight */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2 mt-4">
            <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Overwhelming Consensus:</strong> Tree Plantation leads all citizen demands at{' '}
              <strong className="text-white">39.2% (20 votes)</strong>, followed by Water Conservation at{' '}
              <strong className="text-white">21.6% (11 votes)</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Heat Perception vs Health Consequences */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Temperature Rise &amp; Health Morbidity Triad</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-evaluating Questions 1, 2, and 8 on micro-climatic heating and public health stress
            </p>
          </div>
          <BadgeOrigin type="source" citation="Q1, Q2, Q8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Q1 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Q1. Temperature Change</span>
              <span className="text-[10px] font-mono text-slate-400">Page 1</span>
            </div>
            <p className="text-xs text-slate-300">Noticed local temperature change in recent years?</p>
            <div className="space-y-2 pt-2">
              {questions.Q1?.distribution.map(d => (
                <div key={d.option}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{d.option}</span>
                    <span className="font-semibold text-white">{d.count} ({d.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.option === 'Yes' ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-400">Q2. Hotter Summers</span>
              <span className="text-[10px] font-mono text-slate-400">Page 1</span>
            </div>
            <p className="text-xs text-slate-300">Summers becoming hotter than before?</p>
            <div className="space-y-2 pt-2">
              {questions.Q2?.distribution.map(d => (
                <div key={d.option}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{d.option}</span>
                    <span className="font-semibold text-white">{d.count} ({d.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.option === 'Yes' ? 'bg-orange-400' : 'bg-slate-500'}`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Q8 */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400">Q8. Heat Health Problems</span>
              <span className="text-[10px] font-mono text-slate-400">Page 1</span>
            </div>
            <p className="text-xs text-slate-300">Experienced health problems during extreme heat?</p>
            <div className="space-y-2 pt-2">
              {questions.Q8?.distribution.map(d => (
                <div key={d.option}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{d.option}</span>
                    <span className="font-semibold text-white">{d.count} ({d.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.option === 'Yes' ? 'bg-rose-400' : 'bg-slate-500'}`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Water Paradox Matrix (Q4 Flooding vs Q5 Shortages vs Q10 Drinking Water) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flooding vs Water Shortages Comparison */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Hydrological Paradox
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Flooding (Q4) vs. Water Shortages (Q5)
              </h3>
            </div>
            <BadgeOrigin type="calculated" />
          </div>
          <p className="text-xs text-slate-400">
            Comparing citizen frequency reports for monsoon waterlogging vs summer water shortages
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Frequency Tier</th>
                  <th className="py-2.5 px-3 text-cyan-300">Flooding (Q4)</th>
                  <th className="py-2.5 px-3 text-blue-300">Water Shortage (Q5)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {['Frequently', 'Sometimes', 'Rarely', 'Never'].map(tier => {
                  const fCount = questions.Q4?.distribution.find(d => d.option === tier)?.count || 0;
                  const fPct = questions.Q4?.distribution.find(d => d.option === tier)?.percentage || 0;
                  const sCount = questions.Q5?.distribution.find(d => d.option === tier)?.count || 0;
                  const sPct = questions.Q5?.distribution.find(d => d.option === tier)?.percentage || 0;

                  return (
                    <tr key={tier} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-white">{tier}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">
                        {fCount} ({fPct}%)
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-300">
                        {sCount} ({sPct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <strong>Key takeaway:</strong> Only <strong className="text-white">3.9% (2 respondents)</strong> have Never
            experienced water shortages, despite 60.8% experiencing monsoon waterlogging.
          </div>
        </div>

        {/* Drinking Water Availability Trajectory (Q10) */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
                  Question 10 Trajectory
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Drinking Water Availability Shift
                </h3>
              </div>
              <BadgeOrigin type="source" citation="Q10, Page 1" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              "Have you noticed changes in the availability of drinking water?"
            </p>

            <div className="h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questions.Q10?.distribution || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="option" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} responses (${item.payload.percentage}%)`,
                      'Count'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {(questions.Q10?.distribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.option === 'Decreased' ? '#ef4444' :
                          entry.option === 'Increased' ? '#0ea5e9' :
                          entry.option === 'No Change' ? '#10b981' : '#64748b'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            Note: 45.1% reported "Increased" (reflecting municipal connection expansion / tanker reliance), while 29.4%
            reported direct "Decreased" natural availability.
          </p>
        </div>
      </div>

      {/* Row 4: Environmental Concern & Climate Awareness (Q12 vs Q13) */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Public Climate Literacy &amp; Concern Index</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating preparedness, awareness of causes (Q13), and severity of community concern (Q12)
            </p>
          </div>
          <BadgeOrigin type="source" citation="Q12, Q13" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Concern Distribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Q12. Concern Level for Local Climate
            </h4>
            <div className="space-y-2">
              {concernData.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200">{d.name}</span>
                    <span className="font-mono text-slate-400">{d.count} ({d.percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.name === 'Very Concerned' ? 'bg-purple-500' :
                        d.name === 'Concerned' ? 'bg-indigo-400' :
                        d.name === 'Neutral' ? 'bg-slate-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Awareness Distribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Q13. Awareness of Climate Change Causes
            </h4>
            <div className="space-y-2">
              {questions.Q13?.distribution.map(d => (
                <div key={d.option}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-200">{d.option}</span>
                    <span className="font-mono text-slate-400">{d.count} ({d.percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.option === 'Yes' ? 'bg-cyan-500' :
                        d.option === 'A little' ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
