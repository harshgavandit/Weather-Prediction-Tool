import React from 'react';
import {
  ArrowLeft, ArrowRight, BookOpenCheck, Building2, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardCheck, Clock3, Droplets, ExternalLink, FileText, HeartHandshake, Leaf, Lightbulb,
  MapPinned, Printer, Search, ShieldAlert, Sparkles, Sprout, ThermometerSun, Trash2, Users, Wind, Zap
} from 'lucide-react';
import { PhotoEvidence, SurveyResponseData } from '../types';
import {
  ActionPriority, buildCommunityActionSummary, buildParticipantActionPlan, ParticipantAction
} from '../utils/participantActionPlan';
import { BadgeOrigin } from './BadgeOrigin';

interface ParticipantActionPlansProps {
  surveyData: SurveyResponseData;
  photoEvidence: PhotoEvidence[];
  onInspectResponse: (recordId: string) => void;
}

const icons = {
  heat: ThermometerSun, water: Droplets, flood: MapPinned, agriculture: Sprout, air: Wind,
  preparedness: ShieldAlert, nature: Leaf, waste: Trash2, energy: Zap, awareness: BookOpenCheck
};

const priorityStyle: Record<ActionPriority, string> = {
  Immediate: 'border-rose-400/25 bg-rose-500/10 text-rose-300',
  High: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  Moderate: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-300'
};

const actionAccent: Record<ParticipantAction['icon'], string> = {
  heat: 'from-rose-500/25 to-orange-500/5 text-rose-300',
  water: 'from-cyan-500/25 to-blue-500/5 text-cyan-300',
  flood: 'from-blue-500/25 to-indigo-500/5 text-blue-300',
  agriculture: 'from-lime-500/25 to-emerald-500/5 text-lime-300',
  air: 'from-sky-500/25 to-cyan-500/5 text-sky-300',
  preparedness: 'from-amber-500/25 to-orange-500/5 text-amber-300',
  nature: 'from-emerald-500/25 to-teal-500/5 text-emerald-300',
  waste: 'from-yellow-500/25 to-amber-500/5 text-yellow-300',
  energy: 'from-violet-500/25 to-cyan-500/5 text-violet-300',
  awareness: 'from-fuchsia-500/25 to-violet-500/5 text-fuchsia-300'
};

const ActionCard = ({ action, index }: { action: ParticipantAction; index: number }) => {
  const [open, setOpen] = React.useState(index < 2);
  const Icon = icons[action.icon];

  return <article className="participant-action-card overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-slate-950/10">
    <button type="button" onClick={() => setOpen(value => !value)} className="w-full p-5 text-left md:p-6" aria-expanded={open}>
      <div className="flex items-start gap-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${actionAccent[action.icon]}`}><Icon className="h-5 w-5"/></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${priorityStyle[action.priority]}`}>{action.priority}</span>
            <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[9px] font-bold text-slate-400">Priority score {action.score}/100</span>
            <span className="text-[9px] font-semibold text-slate-500">{action.sector}</span>
          </div>
          <h3 className="mt-3 text-base font-extrabold tracking-tight text-white md:text-lg">{action.title}</h3>
          <p className="mt-2 max-w-4xl text-[11px] leading-5 text-slate-400">{action.responseAlignment}</p>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-300"><Clock3 className="h-3.5 w-3.5"/>{action.timing}</div>
        </div>
        {open ? <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-slate-500"/> : <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-500"/>}
      </div>
    </button>

    {open && <div className="border-t border-slate-800 px-5 pb-6 pt-5 md:px-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-emerald-400/10 bg-emerald-500/[.035] p-4">
          <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-300"/><h4 className="text-xs font-extrabold text-white">Actions to take</h4></div>
          <ol className="mt-4 grid gap-3">{action.actionSteps.map((step, stepIndex) => <li key={step} className="flex gap-3 text-[11px] leading-5 text-slate-300"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 font-mono text-[9px] font-bold text-emerald-300">{stepIndex + 1}</span><span>{step}</span></li>)}</ol>
        </section>
        <section className="rounded-2xl border border-cyan-400/10 bg-cyan-500/[.035] p-4">
          <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-cyan-300"/><h4 className="text-xs font-extrabold text-white">How this helps people</h4></div>
          <p className="mt-3 text-[11px] leading-5 text-slate-300">{action.peopleImpact}</p>
          <div className="mt-4 flex flex-wrap gap-2">{action.beneficiaries.map(person => <span key={person} className="rounded-lg border border-slate-700/80 bg-slate-950/45 px-2.5 py-1.5 text-[9px] text-slate-400">{person}</span>)}</div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-500">Why it was suggested</p><p className="mt-2 text-[10px] leading-5 text-slate-300">{action.challenge}</p></section>
        <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-500">Who can implement it</p><ul className="mt-2 space-y-1.5">{action.implementers.map(item => <li key={item} className="flex gap-2 text-[10px] text-slate-300"><Building2 className="h-3 w-3 shrink-0 text-slate-500"/>{item}</li>)}</ul></section>
        <section className="rounded-xl border border-slate-800 bg-slate-950/35 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-500">Measure the impact</p><ul className="mt-2 space-y-1.5">{action.successIndicators.map(item => <li key={item} className="flex gap-2 text-[10px] text-slate-300"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400"/>{item}</li>)}</ul></section>
      </div>

      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-950/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-slate-500">Response evidence used</p><BadgeOrigin type="source" citation="RESPONSES.pdf, p.1"/></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{action.evidence.map(item => <div key={item.questionId} title={item.question} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><div className="flex items-center justify-between gap-2"><strong className="font-mono text-[10px] text-emerald-300">{item.questionId}</strong><span className="text-[9px] text-slate-500">{item.citation}</span></div><p className="mt-1.5 text-[10px] leading-4 text-slate-300">Recorded answer: <strong className="text-white">{item.answer}</strong></p></div>)}</div>
      </section>
    </div>}
  </article>;
};

export const ParticipantActionPlans: React.FC<ParticipantActionPlansProps> = ({ surveyData, photoEvidence, onInspectResponse }) => {
  const [selectedId, setSelectedId] = React.useState(surveyData.records[0]?.id || '');
  const [search, setSearch] = React.useState('');
  const [showAllAnswers, setShowAllAnswers] = React.useState(false);
  const records = surveyData.records;
  const selectedIndex = Math.max(0, records.findIndex(record => record.id === selectedId));
  const record = records[selectedIndex] || records[0];
  const plan = React.useMemo(() => buildParticipantActionPlan(record, surveyData.metadata.questions), [record, surveyData.metadata.questions]);
  const community = React.useMemo(() => buildCommunityActionSummary(records, surveyData.metadata.questions), [records, surveyData.metadata.questions]);
  const participantPhotos = photoEvidence.filter(photo => photo.participant.id === record.id);
  const visibleRecords = records.filter(item => `${item.respondentId} ${item.id} ${item.answers.Q14 || ''} ${item.answers.Q15 || ''}`.toLowerCase().includes(search.toLowerCase()));
  const answerEntries = Object.entries(record.answers);
  const displayedAnswers = showAllAnswers ? answerEntries : answerEntries.slice(0, 6);
  const topCommunity = community[0];

  const move = (direction: number) => {
    const nextIndex = (selectedIndex + direction + records.length) % records.length;
    setSelectedId(records[nextIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div className="workspace-enter space-y-6">
    <section className="hero-panel overflow-hidden p-6 md:p-8">
      <div className="relative z-10 grid gap-7 xl:grid-cols-[1fr_360px] xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2"><p className="eyebrow">People-centred response intelligence</p><BadgeOrigin type="ai"/></div>
          <h1 className="display-title mt-4">From every survey response to a practical impact plan.</h1>
          <p className="mt-4 max-w-3xl text-xs leading-6 text-slate-400">Explore all 51 anonymous participants. Each plan connects recorded Q1–Q15 answers to actions, timing, implementers, expected people-level benefits and measurable outcomes. It is planning guidance—not a prediction or an official risk assessment.</p>
          <div className="mt-5 flex flex-wrap gap-2"><BadgeOrigin type="source" citation="RESPONSES.pdf · p.1"/><BadgeOrigin type="calculated"/><BadgeOrigin type="scenario"/></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-emerald-400/15 bg-slate-950/45 p-4"><Users className="h-4 w-4 text-emerald-300"/><strong className="mt-3 block text-2xl text-white">51</strong><span className="text-[9px] text-slate-500">Participant plans</span></div>
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/45 p-4"><Lightbulb className="h-4 w-4 text-cyan-300"/><strong className="mt-3 block text-2xl text-white">{community.length}</strong><span className="text-[9px] text-slate-500">Action themes</span></div>
          <div className="rounded-2xl border border-violet-400/15 bg-slate-950/45 p-4"><FileText className="h-4 w-4 text-violet-300"/><strong className="mt-3 block text-2xl text-white">15</strong><span className="text-[9px] text-slate-500">Answers traced</span></div>
        </div>
      </div>
    </section>

    <section className="data-panel overflow-hidden">
      <div className="border-b border-slate-800 p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="eyebrow">Choose a response</p><h2 className="mt-1 text-lg font-extrabold text-white">Participant action-plan navigator</h2><p className="mt-1 text-[10px] text-slate-500">Search by anonymous participant, response ID, biggest problem or preferred action.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => move(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-400/40 hover:text-white" aria-label="Previous participant"><ArrowLeft className="h-4 w-4"/></button>
            <select value={selectedId} onChange={event => setSelectedId(event.target.value)} className="h-10 min-w-[220px] rounded-xl border border-slate-700 bg-slate-950 px-3 text-[11px] font-bold text-white outline-none focus:border-emerald-400/50">{records.map(item => <option key={item.id} value={item.id}>{item.respondentId} · {item.id}</option>)}</select>
            <button type="button" onClick={() => move(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-300 hover:border-emerald-400/40 hover:text-white" aria-label="Next participant"><ArrowRight className="h-4 w-4"/></button>
            <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 px-3 text-[10px] font-bold text-slate-300 hover:border-cyan-400/40 hover:text-white"><Printer className="h-4 w-4"/> Print plan</button>
          </div>
        </div>
        <div className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/45 px-3"><Search className="h-4 w-4 text-slate-500"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the 51 response plans…" className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-600"/><span className="text-[9px] text-slate-500">{visibleRecords.length} matches</span></div>
        {search && <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{visibleRecords.map(item => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setSearch(''); }} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-left text-[9px] text-slate-400 hover:border-emerald-400/30 hover:text-white"><strong className="text-slate-200">{item.respondentId}</strong> · {item.answers.Q14 || 'No priority'} · {item.answers.Q15 || 'No action'}</button>)}</div>}
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
      <div className="space-y-5">
        <article className="data-panel p-5 md:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Selected source record</p><h2 className="mt-2 text-xl font-extrabold text-white">{record.respondentId}</h2><p className="mt-1 font-mono text-[9px] text-slate-500">{record.id} · PDF p.{record.pageNumber} · row {record.rowNumber}</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300"><Users className="h-5 w-5"/></div></div>
          <p className="mt-5 text-[11px] leading-5 text-slate-300">{plan.summary}</p>
          <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><strong className="block text-lg text-white">{plan.actions.length}</strong><span className="text-[8px] text-slate-500">Action areas</span></div><div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><strong className="block text-lg text-rose-300">{plan.immediateActions}</strong><span className="text-[8px] text-slate-500">Immediate</span></div><div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><strong className="block text-lg text-cyan-300">{participantPhotos.length}</strong><span className="text-[8px] text-slate-500">Field photos</span></div></div>
          <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-500/[.035] p-3 text-[9px] leading-4 text-amber-100/70">Priority scores are transparent planning weights from this participant’s categorical answers. They are not probabilities, diagnoses or measured hazard levels.</div>
          <button type="button" onClick={() => onInspectResponse(record.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[10px] font-extrabold text-emerald-200 hover:bg-emerald-500/15"><ExternalLink className="h-3.5 w-3.5"/> Inspect full source response</button>
        </article>

        <article className="data-panel p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Recorded answer snapshot</p><h2 className="mt-1 text-sm font-extrabold text-white">Q1–Q15 source trail</h2></div><BadgeOrigin type="source" citation="PDF p.1"/></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{displayedAnswers.map(([questionId, answer]) => <div key={questionId} title={surveyData.metadata.questions[questionId]?.text} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2.5"><span className="font-mono text-[9px] font-bold text-emerald-300">{questionId}</span><strong className={`text-right text-[10px] ${answer ? 'text-slate-200' : 'text-slate-600'}`}>{answer || 'No answer recorded'}</strong></div>)}</div>
          <button type="button" onClick={() => setShowAllAnswers(value => !value)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2.5 text-[9px] font-bold text-slate-400 hover:text-white">{showAllAnswers ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}{showAllAnswers ? 'Show fewer answers' : 'Show all 15 answers'}</button>
        </article>
      </div>

      <div className="space-y-4">
        <div className="data-panel p-5 md:p-6"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">Response-linked action portfolio</p><h2 className="mt-1 text-lg font-extrabold text-white">What should happen, when and why</h2><p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-500">Highest priorities appear first. Open any card to inspect action steps, expected people impact, implementers, measurement and exact response evidence.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2"><Sparkles className="h-4 w-4 text-violet-300"/><span className="text-[9px] text-slate-400">Top score <strong className="text-white">{plan.highestPriorityScore}/100</strong></span></div></div></div>
        {plan.actions.length ? plan.actions.map((action, index) => <ActionCard key={`${record.id}-${action.id}`} action={action} index={index}/>) : <div className="empty-state"><div><Lightbulb/></div><p className="eyebrow">No rule triggered</p><h2>No specific action suggested</h2><p>Review the original response and collect more local evidence before planning an intervention.</p></div>}
      </div>
    </section>

    <section className="data-panel p-5 md:p-6">
      <div className="panel-heading"><div><p className="eyebrow">Across all 51 responses</p><h2>Community action demand</h2><p className="mt-2 max-w-3xl text-[10px] leading-5 text-slate-500">This comparison counts how many participants trigger each transparent action rule. It helps coordinators find shared needs while retaining every participant’s individual source trail.</p></div>{topCommunity && <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[.045] px-4 py-3 text-right"><span className="text-[8px] uppercase tracking-wider text-slate-500">Most common</span><strong className="mt-1 block text-[11px] text-emerald-200">{topCommunity.sector}</strong></div>}</div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{community.map((item, index) => <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className="font-mono text-[10px] font-bold text-slate-600">{String(index + 1).padStart(2, '0')}</span><div><strong className="block text-[11px] text-slate-200">{item.title}</strong><span className="mt-1 block text-[9px] text-slate-500">{item.sector} · average planning score {item.averageScore}</span></div></div><strong className="shrink-0 text-sm text-white">{item.participants}<span className="ml-1 text-[9px] font-normal text-slate-500">people</span></strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${item.percentage}%` }}/></div><div className="mt-2 flex justify-between text-[8px] text-slate-600"><span>Rule triggered</span><span>{item.percentage}% of responses</span></div></article>)}</div>
    </section>

    <section className="rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-500/[.04] to-emerald-500/[.04] p-5 md:p-6">
      <div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300"><Lightbulb className="h-5 w-5"/></div><div><p className="eyebrow">Responsible use</p><h2 className="mt-1 text-sm font-extrabold text-white">Use these plans to start local discussion—not to label a person or predict an event.</h2><p className="mt-2 max-w-5xl text-[10px] leading-5 text-slate-400">The source contains anonymous perceptions and preferences. Before spending money or changing infrastructure, validate the location, affected population, feasibility, responsible authority and outcome measure. Missing answers remain missing; no response is imputed.</p></div></div>
    </section>
  </div>;
};
