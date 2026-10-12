import { useState } from 'react';
import { Check, Link } from 'lucide-react';
import { createViewHash, EvidenceFilters } from '../../shared/viewNavigation.js';

export function ShareSurveyView({ filters }: { filters: EvidenceFilters }) {
  const [result, setResult] = useState<{ hash: string; copied: boolean; link: string } | null>(null);
  const hash = createViewHash('evidence', filters);
  const currentResult = result?.hash === hash ? result : null;

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.hash = hash;
    const link = url.toString();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link);
      setResult({ hash, copied: true, link });
    } catch {
      setResult({ hash, copied: false, link });
    }
  };

  return <div className="border-t border-slate-800 pt-3 space-y-2">
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 transition">
        {currentResult?.copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link className="w-4 h-4" aria-hidden="true" />}
        {currentResult?.copied ? 'View link copied' : 'Copy view link'}
      </button>
      <p className="text-slate-400">Links include your survey search and selected filters.</p>
    </div>
    <p role="status" aria-live="polite" className="text-xs text-emerald-300">
      {currentResult && (currentResult.copied ? 'Link copied. Opening it restores this survey view.' : 'Clipboard access is unavailable. Select and copy the link below.')}
    </p>
    {currentResult && !currentResult.copied && <label className="block text-xs text-slate-300">
      Survey view link
      <input readOnly value={currentResult.link} onFocus={event => event.currentTarget.select()} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500" />
    </label>}
  </div>;
}
