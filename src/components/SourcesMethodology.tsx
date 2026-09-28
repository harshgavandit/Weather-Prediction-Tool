import React from 'react';
import { Calculator, CheckCircle2, ExternalLink, FileCheck2, Fingerprint, ShieldCheck } from 'lucide-react';
import { SurveyResponseData } from '../types';
import { BadgeOrigin } from './BadgeOrigin';

interface Props {
  surveyData: SurveyResponseData;
  onOpenPdf: () => void;
}

export const SourcesMethodology: React.FC<Props> = ({ surveyData, onOpenPdf }) => (
  <div className="workspace-enter space-y-6">
    <section className="hero-panel p-6 md:p-8">
      <p className="eyebrow">Evidence ledger</p>
      <h1 className="display-title mt-2">One source. Every result traceable.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">The platform uses only RESPONSES.pdf. Direct answers, calculated statistics, and analyst interpretation are visually separated so readers can see what the participants said and what the application derived.</p>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <article className="source-card">
        <div className="source-card-icon source-pdf"><FileCheck2 /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2>Original survey PDF</h2><BadgeOrigin type="source" /></div>
          <p>RESPONSES.pdf · page 1 · {surveyData.analytics.totalRecords} rows · {Object.keys(surveyData.metadata.questions).length} questions</p>
          <dl><div><dt>Coverage</dt><dd>{surveyData.provenance.surveyPeriod.start} to {surveyData.provenance.surveyPeriod.end}</dd></div><div><dt>Geography</dt><dd>{surveyData.provenance.geographicScope}</dd></div><div><dt>Traceability</dt><dd>Participant ID, source row, page and question are retained.</dd></div></dl>
          <button onClick={onOpenPdf} className="source-action">Inspect original PDF <ExternalLink className="h-3.5 w-3.5"/></button>
        </div>
      </article>

      <article className="source-card">
        <div className="source-card-icon source-era"><Calculator /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2>Verified analysis layer</h2><BadgeOrigin type="calculated" /></div>
          <p>Counts, percentages, rankings and cross-question patterns calculated from the extracted PDF rows.</p>
          <dl><div><dt>Answer cells</dt><dd>765 checked against the source extraction</dd></div><div><dt>Missing values</dt><dd>3 blank answers preserved; nothing imputed</dd></div><div><dt>External feeds</dt><dd>None used by the website</dd></div></dl>
        </div>
      </article>
    </section>

    <section className="data-panel p-5 md:p-6">
      <div className="panel-heading"><div><p className="eyebrow">Interpretation key</p><h2>How to read the platform</h2></div><Fingerprint className="h-5 w-5 text-cyan-300"/></div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="legend-tile"><BadgeOrigin type="source"/><h3>Source data</h3><p>Answers directly present in the PDF. Page and question references are shown.</p></div>
        <div className="legend-tile"><BadgeOrigin type="calculated"/><h3>Calculated analysis</h3><p>Counts, percentages, comparisons and rankings computed from the 51 records.</p></div>
        <div className="legend-tile"><BadgeOrigin type="ai"/><h3>Interpretation</h3><p>Plain-language synthesis and conditional recommendations—not measured climate fact.</p></div>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <article className="data-panel p-5 md:p-6"><div className="panel-heading"><div><p className="eyebrow">Privacy</p><h2>Public-data boundary</h2></div><ShieldCheck className="h-5 w-5 text-emerald-300"/></div><ul className="check-list"><li><CheckCircle2/>Names, emails and phone numbers are removed from the public JSON, UI and CSV.</li><li><CheckCircle2/>Stable Participant IDs preserve row-level traceability.</li><li><CheckCircle2/>The original PDF remains available for authorized source verification and contains personal data.</li></ul></article>
      <article className="data-panel p-5 md:p-6"><div className="panel-heading"><div><p className="eyebrow">Boundaries</p><h2>What is not claimed</h2></div><ShieldCheck className="h-5 w-5 text-amber-300"/></div><ul className="check-list muted"><li><CheckCircle2/>The survey is not presented as statistically representative of a named region.</li><li><CheckCircle2/>Respondent perceptions do not prove physical climate trends or establish causation.</li><li><CheckCircle2/>Sector scores and recommendations are educational interpretations, not forecasts or official risk probabilities.</li></ul></article>
    </section>
  </div>
);
