export const APP_VIEWS = Object.freeze([
  'overview', 'weather-advisor', 'evidence', 'analytics',
  'geo-evidence', 'impacts', 'actions', 'sources'
]);

export const DEFAULT_EVIDENCE_FILTERS = Object.freeze({
  search: '', concern: 'all', problem: 'all', action: 'all', flood: 'all'
});

const aliases = new Map([
  ['pdf-explorer', 'evidence'], ['sector-impacts', 'impacts'],
  ['risk-engine', 'impacts'], ['roadmap', 'actions']
]);
const filterQuestions = { concern: 'Q12', problem: 'Q14', action: 'Q15', flood: 'Q4' };

export function resolveAppView(view) {
  const resolved = aliases.get(view) || view;
  return APP_VIEWS.includes(resolved) ? resolved : 'overview';
}

export function normalizeEvidenceFilters(filters = {}, records) {
  const normalized = { ...DEFAULT_EVIDENCE_FILTERS };
  if (typeof filters.search === 'string') normalized.search = filters.search.slice(0, 200);
  for (const [key, question] of Object.entries(filterQuestions)) {
    const value = filters[key];
    if (typeof value !== 'string' || !value || value.length > 200) continue;
    if (!records || value === 'all' || records.some(record => record.answers[question] === value)) {
      normalized[key] = value;
    }
  }
  return normalized;
}

export function parseViewHash(hash) {
  const [rawView, ...queryParts] = hash.replace(/^#\/?/, '').split('?');
  const view = resolveAppView(rawView);
  const filters = view === 'evidence'
    ? normalizeEvidenceFilters(Object.fromEntries(new URLSearchParams(queryParts.join('?'))))
    : { ...DEFAULT_EVIDENCE_FILTERS };
  return { view, filters };
}

export function createViewHash(view, filters = DEFAULT_EVIDENCE_FILTERS) {
  const resolved = resolveAppView(view);
  const params = new URLSearchParams();
  if (resolved === 'evidence') {
    const normalized = normalizeEvidenceFilters(filters);
    for (const key of Object.keys(DEFAULT_EVIDENCE_FILTERS)) {
      if (normalized[key] !== DEFAULT_EVIDENCE_FILTERS[key]) params.set(key, normalized[key]);
    }
  }
  const query = params.toString();
  return `#/${resolved}${query ? `?${query}` : ''}`;
}
