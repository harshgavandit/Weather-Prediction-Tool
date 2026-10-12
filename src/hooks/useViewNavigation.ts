import { useEffect, useState } from 'react';
import {
  createViewHash, normalizeEvidenceFilters, parseViewHash, resolveAppView,
  EvidenceFilters, ViewState
} from '../../shared/viewNavigation.js';
import type { SurveyRecord } from '../types';

export function useViewNavigation(records?: readonly SurveyRecord[]) {
  const [navigation, setNavigation] = useState<ViewState>(() => parseViewHash(window.location.hash));

  useEffect(() => {
    const restoreLocation = () => {
      const restored = parseViewHash(window.location.hash);
      restored.filters = normalizeEvidenceFilters(restored.filters, records);
      const canonicalHash = createViewHash(restored.view, restored.filters);
      if (window.location.hash !== canonicalHash) {
        window.history.replaceState(window.history.state, '', canonicalHash);
      }
      setNavigation(previous => ({
        view: restored.view,
        // Keep the last survey selection while visiting another section.
        filters: restored.view === 'evidence' ? restored.filters : previous.filters
      }));
    };
    restoreLocation();
    window.addEventListener('popstate', restoreLocation);
    window.addEventListener('hashchange', restoreLocation);
    return () => {
      window.removeEventListener('popstate', restoreLocation);
      window.removeEventListener('hashchange', restoreLocation);
    };
  }, [records]);

  const navigate = (view: string) => {
    const next = { ...navigation, view: resolveAppView(view) };
    const hash = createViewHash(next.view, next.filters);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setNavigation(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const setFilters = (filters: EvidenceFilters) => {
    const next = { ...navigation, filters: normalizeEvidenceFilters(filters, records) };
    // Editing a filter should not create a history entry for each keystroke.
    window.history.replaceState(window.history.state, '', createViewHash(next.view, next.filters));
    setNavigation(next);
  };

  return { activeTab: navigation.view, filters: navigation.filters, navigate, setFilters };
}
