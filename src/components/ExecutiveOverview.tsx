import React from 'react';
import { ArrowRight, BarChart3, Droplets, FileText, Flame, HeartPulse, ShieldCheck, Sparkles, Users, Waves } from 'lucide-react';
import { SurveyResponseData } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface Props {
  surveyData: SurveyResponseData;
  onNavigateTab: (tab: string) => void;
  onOpenPdfModal: () => void;
}

export const ExecutiveOverview: React.FC<Props> = ({ surveyData, onNavigateTab, onOpenPdfModal }) => {
  const stat = (question: string, options: string[]) => Number((surveyData.analytics.questions[question]?.distribution || []).filter(item => options.includes(item.option)).reduce((sum, item) => sum + item.percentage, 0).toFixed(1));
  const topAnswer = (question: string) => surveyData.analytics.questions[question]?.distribution[0];
  const kpis = [
    { label: 'Noticed temperature change', value: stat('Q1', ['Yes']), q: 'Q1', icon: Flame, tone: 'amber' },
    { label: 'Report water shortages', value: stat('Q5', ['Frequently', 'Sometimes']), q: 'Q5', icon: Droplets, tone: 'cyan' },
    { label: 'Experience flooding', value: stat('Q4', ['Frequently', 'Sometimes']), q: 'Q4', icon: Waves, tone: 'blue' },
    { label: 'Heat-related health effects', value: stat('Q8', ['Yes']), q: 'Q8', icon: HeartPulse, tone: 'rose' }
  ];
  const priorities = surveyData.analytics.questions.Q15.distribution.slice(0, 5);
  const findings = [
    { label: 'Hotter summers reported', value: `${stat('Q2', ['Yes'])}%`, citation: 'Q2' },
    { label: 'Rainfall pattern changed', value: `${stat('Q3', ['Yes'])}%`, citation: 'Q3' },
    { label: 'Daily life affected', value: `${stat('Q7', ['Yes'])}%`, citation: 'Q7' },
    { label: 'Leading problem selected', value: topAnswer('Q14')?.option || 'Not available', citation: 'Q14' }
  ];

  return <div className="workspace-enter space-y-6">
    <section className="hero-panel command-hero p-6 md:p-9">
      <div className="relative z-10 max-w-4xl">
        <div className="mb-5 flex flex-wrap gap-2"><BadgeOrigin type="source" citation="PDF p.1"/><BadgeOrigin type="calculated"/><BadgeOrigin type="ai"/></div>
        <p className="eyebrow">PDF intelligence · evidence before inference</p>
        <h1 className="display-title mt-3">From one dense survey PDF to insights people can understand.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300">Explore all 51 anonymized responses, compare perceptions across every question, and review transparent summaries and practical recommendations. Survey results come from RESPONSES.pdf; any participant photos are clearly separated as later field evidence. No live weather, forecast, or external climate feed is used.</p>
        <div className="mt-6 flex flex-wrap gap-3"><button className="primary-cta" onClick={() => onNavigateTab('evidence')}><Sparkles/> Explore the evidence <ArrowRight/></button><button className="secondary-cta" onClick={onOpenPdfModal}><FileText/> Inspect source PDF</button></div>
      </div>
      <div className="hero-stats"><div><Users/><strong>51</strong><span>anonymous participants</span></div><div><FileText/><strong>765</strong><span>answer cells verified</span></div><div><ShieldCheck/><strong>3</strong><span>blank answers preserved</span></div></div>
    </section>

    <section className="metric-grid">
      {kpis.map(({ label, value, q, icon: Icon, tone }, index) => <button onClick={() => onNavigateTab('analytics')} className="metric-card text-left" style={{ '--delay': `${index * 65}ms` } as React.CSSProperties} key={q}><div className={`metric-icon metric-${tone}`}><Icon/></div><p>{label}</p><strong>{value}%</strong><span>RESPONSES.pdf · {q} · page 1</span></button>)}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="data-panel p-5 md:p-6">
        <div className="panel-heading"><div><p className="eyebrow">Survey pulse</p><h2>What participants reported</h2></div><BadgeOrigin type="calculated"/></div>
        <div className="weather-facts mt-5">{findings.map(item => <div key={item.citation}><span>{item.label}</span><strong>{item.value}</strong><small>PDF p.1 · {item.citation}</small></div>)}</div>
        <button className="text-action" onClick={() => onNavigateTab('analytics')}>Open survey analytics <ArrowRight/></button>
      </article>

      <article className="data-panel p-5 md:p-6">
        <div className="panel-heading"><div><p className="eyebrow">Citizen-selected action</p><h2>Priority distribution</h2></div><BadgeOrigin type="source" citation="Q15"/></div>
        <div className="priority-list">{priorities.map((item, index) => <div key={item.option}><div><span>{index + 1}. {item.option}</span><strong>{item.percentage}%</strong></div><i><b style={{ width: `${item.percentage}%` }}/></i></div>)}</div>
      </article>
    </section>

    <section className="insight-banner"><div className="insight-icon"><BarChart3/></div><div><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">Calculated survey pattern</p><BadgeOrigin type="ai"/></div><h2>Flood exposure and water shortage coexist in these responses.</h2><p>{stat('Q4', ['Frequently','Sometimes'])}% report flooding at least sometimes, while {stat('Q5', ['Frequently','Sometimes'])}% report water shortages at least sometimes. This is a pattern in participant answers and supports further local investigation; it does not establish physical cause or regional prevalence.</p></div><button onClick={() => onNavigateTab('impacts')}>Review impacts <ArrowRight/></button></section>
  </div>;
};
