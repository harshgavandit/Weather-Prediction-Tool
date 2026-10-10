import React, { useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUpRight, CloudSun, MessageCircle, RotateCcw, Send, ShieldCheck, SlidersHorizontal, Sparkles, Thermometer, X } from 'lucide-react';
import { answerWeatherQuestion, EXAMPLE_QUESTIONS, QUESTION_LIMIT, WeatherAnswer } from '../../shared/weatherAdvisor.js';
import '../weather-advisor.css';

const emptyConditions = {
  location: '', temperatureC: '', feelsLikeC: '', humidityPct: '', windKmh: '', uvIndex: '',
  condition: 'unknown', airQuality: 'unknown'
};

const numericFields = [
  { key: 'temperatureC', label: 'Temperature', unit: '°C', min: -60, max: 60, placeholder: 'e.g. 28' },
  { key: 'feelsLikeC', label: 'Feels like', unit: '°C', min: -70, max: 70, placeholder: 'e.g. 32' },
  { key: 'humidityPct', label: 'Humidity', unit: '%', min: 0, max: 100, placeholder: 'e.g. 70' },
  { key: 'windKmh', label: 'Wind speed', unit: 'km/h', min: 0, max: 300, placeholder: 'e.g. 12' },
  { key: 'uvIndex', label: 'UV index', unit: '', min: 0, max: 25, placeholder: 'e.g. 6' }
] as const;

type ConversationEntry = { id: number; question: string; answer: WeatherAnswer };

export const WeatherAdvisor: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [conditions, setConditions] = useState(emptyConditions);
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const questionInput = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);
  const latestAnswer = useRef<HTMLElement>(null);
  const conditionsCount = Object.values(conditions).filter(value => value !== '' && value !== 'unknown').length;

  const ask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) {
      setErrors(['Enter a weather or wellbeing question first.']);
      questionInput.current?.focus();
      return;
    }
    const answer = answerWeatherQuestion(question, conditions);
    if (answer.inputErrors.length && answer.level !== 'urgent') {
      setErrors(answer.inputErrors);
      setConditionsOpen(true);
      return;
    }
    const entry = { id: nextId.current++, question: question.trim(), answer };
    setHistory(previous => [entry, ...previous].slice(0, 8));
    setErrors([]);
    setQuestion('');
    setAnnouncement(`${answer.title}. ${answer.summary}`);
    requestAnimationFrame(() => {
      latestAnswer.current?.focus({ preventScroll: true });
      latestAnswer.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    });
  };

  const selectExample = (example: string) => {
    setQuestion(example);
    setErrors([]);
    questionInput.current?.focus();
  };

  const clearConversation = () => {
    setHistory([]);
    setErrors([]);
    setAnnouncement('Conversation cleared.');
    questionInput.current?.focus();
  };

  return <div className="weather-advisor workspace-enter space-y-6">
    <section className="hero-panel advisor-hero">
      <div className="advisor-hero-copy">
        <p className="eyebrow"><CloudSun aria-hidden="true"/> Weather prediction & recommendations</p>
        <h1 className="display-title">Make a better plan<br/><span>for the weather.</span></h1>
        <p className="advisor-intro">Ask about a morning run, what to wear, or looking after yourself in heat and rain. Add the conditions you know for more relevant guidance.</p>
        <div className="advisor-feature-tags"><span><MessageCircle aria-hidden="true"/> Ask in your own words</span><span><ShieldCheck aria-hidden="true"/> Private, local answers</span></div>
      </div>
      <div className="advisor-source-note"><Thermometer aria-hidden="true"/><strong>Based on what you tell us</strong><p>No live weather feed is connected. This tool offers conditional recommendations; it cannot predict tomorrow’s weather or diagnose symptoms.</p></div>
    </section>

    <form className="data-panel advisor-composer" onSubmit={ask} noValidate>
      <div className="advisor-section-heading"><div><p className="eyebrow">Your weather companion</p><h2>What would you like to know?</h2></div><span className="advisor-local-badge">Works without an API</span></div>
      <label className="advisor-question-label" htmlFor="advisor-question">Your question</label>
      <textarea ref={questionInput} id="advisor-question" rows={3} maxLength={QUESTION_LIMIT} value={question} onChange={event => { setQuestion(event.target.value); if (errors.length) setErrors([]); }} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Can I go for a walk if it is 32°C and humid?" aria-describedby="advisor-question-help" aria-invalid={errors.length > 0} />
      <div className="advisor-question-help" id="advisor-question-help"><span>Include conditions in your question, or add them below. Ctrl/⌘ + Enter to ask.</span><span>{question.length}/{QUESTION_LIMIT}</span></div>

      <details className="advisor-conditions" open={conditionsOpen} onToggle={event => setConditionsOpen(event.currentTarget.open)}>
        <summary><SlidersHorizontal aria-hidden="true"/><span>Add weather conditions <small>(optional)</small></span><span className="advisor-condition-count">{conditionsCount ? `${conditionsCount} supplied` : 'No readings supplied'}</span></summary>
        <p className="advisor-condition-help">Use readings from your thermometer or a local report. Leave unknown values blank. Conditions written in your question take priority over these inputs.</p>
        <div className="advisor-condition-grid">
          <label className="photo-field advisor-location">Location label<input maxLength={80} value={conditions.location} onChange={event => setConditions(previous => ({ ...previous, location: event.target.value }))} placeholder="e.g. Mumbai (optional)"/><span>For your reference; does not fetch local weather.</span></label>
          {numericFields.map(({ key, label, unit, min, max, placeholder }) => <label className="photo-field" key={key}>{label}{unit ? ` (${unit})` : ''}<input type="number" min={min} max={max} step="any" value={conditions[key]} onChange={event => setConditions(previous => ({ ...previous, [key]: event.target.value }))} placeholder={placeholder}/></label>)}
          <label className="photo-field">Weather condition<select value={conditions.condition} onChange={event => setConditions(previous => ({ ...previous, condition: event.target.value }))}><option value="unknown">Unknown</option><option value="clear">Clear</option><option value="cloudy">Cloudy</option><option value="rain">Rain</option><option value="heavy-rain">Heavy rain / flooding</option><option value="thunderstorm">Thunderstorm</option><option value="snow">Snow</option><option value="fog">Fog</option></select></label>
          <label className="photo-field">Air quality<select value={conditions.airQuality} onChange={event => setConditions(previous => ({ ...previous, airQuality: event.target.value }))}><option value="unknown">Unknown</option><option value="good">Good</option><option value="moderate">Moderate</option><option value="poor">Poor / unhealthy</option></select></label>
        </div>
        <button type="button" className="advisor-reset" onClick={() => { setConditions(emptyConditions); setErrors([]); }}><RotateCcw aria-hidden="true"/> Reset conditions</button>
      </details>

      {errors.length > 0 && <div className="advisor-form-errors" role="alert"><AlertTriangle aria-hidden="true"/><div>{errors.map(error => <p key={error}>{error}</p>)}</div></div>}
      <div className="advisor-submit-row"><p>Questions stay in this tab’s memory. No account or upload needed.</p><button type="submit" className="primary-cta"><Send aria-hidden="true"/> Get recommendation</button></div>
    </form>

    <section className="advisor-examples" aria-label="Example questions"><div className="advisor-section-heading"><h2>Need a starting point?</h2><span>Choose a question, then ask</span></div><div className="advisor-example-grid">{EXAMPLE_QUESTIONS.map(example => <button type="button" key={example} onClick={() => selectExample(example)}>{example}<ArrowUpRight aria-hidden="true"/></button>)}</div></section>

    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    {history.length > 0 && <section className="advisor-history" aria-label="Your recommendations"><div className="advisor-section-heading"><h2><Sparkles aria-hidden="true"/> Your recommendations</h2><button type="button" className="advisor-reset" onClick={clearConversation}><X aria-hidden="true"/> Clear conversation</button></div>
      {history.map((entry, index) => <article key={entry.id} ref={index === 0 ? latestAnswer : undefined} tabIndex={-1} className={`data-panel advisor-answer advisor-answer-${entry.answer.level}`} aria-labelledby={`advisor-answer-${entry.id}`}>
        <div className="advisor-asked"><MessageCircle aria-hidden="true"/><p>{entry.question}</p><span>{index === 0 ? 'Latest' : 'Earlier'}</span></div>
        <div className="advisor-answer-body"><div className="advisor-answer-heading"><h3 id={`advisor-answer-${entry.id}`}>{entry.answer.title}</h3><span className={`advisor-level advisor-level-${entry.answer.level}`}>{entry.answer.level === 'urgent' ? 'Urgent symptoms' : entry.answer.level === 'caution' ? 'Take extra care' : 'Conditional guidance'}</span></div><p className="advisor-summary">{entry.answer.summary}</p>
          <ol className="advisor-recommendations">{entry.answer.recommendations.map((recommendation, itemIndex) => <li key={recommendation}><span>{String(itemIndex + 1).padStart(2, '0')}</span><p>{recommendation}</p></li>)}</ol>
          <details className="advisor-basis"><summary><ArrowDown aria-hidden="true"/> Conditions used for this answer</summary>{entry.answer.context.location && <p>Location label: {entry.answer.context.location} (entered by you).</p>}<ul>{entry.answer.basis.map(line => <li key={line}>{line}</li>)}</ul></details>
          <p className="advisor-limitations">{entry.answer.limitations}</p>
          {entry.answer.sources.length > 0 && <div className="advisor-sources"><span>Further reading</span>{entry.answer.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight aria-hidden="true"/></a>)}</div>}
        </div>
      </article>)}
    </section>}
  </div>;
};
