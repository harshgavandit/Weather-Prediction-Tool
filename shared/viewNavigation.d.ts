import type { SurveyRecord } from '../src/types';

export type AppView = 'overview' | 'weather-advisor' | 'evidence' | 'analytics' | 'geo-evidence' | 'impacts' | 'actions' | 'sources';
export interface EvidenceFilters {
  search: string;
  concern: string;
  problem: string;
  action: string;
  flood: string;
}
export interface ViewState { view: AppView; filters: EvidenceFilters }

export const APP_VIEWS: readonly AppView[];
export const DEFAULT_EVIDENCE_FILTERS: Readonly<EvidenceFilters>;
export function resolveAppView(view: string): AppView;
export function normalizeEvidenceFilters(filters?: Partial<EvidenceFilters>, records?: readonly SurveyRecord[]): EvidenceFilters;
export function parseViewHash(hash: string): ViewState;
export function createViewHash(view: string, filters?: EvidenceFilters): string;
