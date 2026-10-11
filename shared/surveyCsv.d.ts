import type { SurveyRecord } from '../src/types';

/** Export public records in their supplied order, preserving blank answers. */
export function createSurveyCsv(records: readonly SurveyRecord[]): string;
