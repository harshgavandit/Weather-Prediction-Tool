import {
  SectoralImpactsData,
  SurveyRecord,
  SurveyResponseData
} from '../types';

const API_BASE = '/api';

type ApiErrorPayload = { message?: string; error?: string };

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let detail = `Request failed with HTTP ${response.status}`;
    try {
      const payload = await response.json() as ApiErrorPayload;
      detail = payload.message || payload.error || detail;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchSurveyData(): Promise<SurveyResponseData> {
  try {
    return await getJson<SurveyResponseData>(`${API_BASE}/survey`);
  } catch (backendError) {
    const response = await fetch('/data/survey_data.json');
    if (!response.ok) throw backendError;
    const raw = await response.json();
    return {
      provenance: {
        sourceFile: 'RESPONSES.pdf',
        totalPages: 1,
        pageCitation: 'Page 1',
        totalSurveyRespondents: raw.records.length,
        surveyPeriod: raw.metadata.surveyDateRange,
        geographicScope: 'Not captured in the source questionnaire',
        notes: 'Public records are anonymized. Blank answers are preserved as null; no values are imputed.'
      },
      metadata: { ...raw.metadata, region: 'Not specified in source PDF' },
      analytics: computeAnalytics(raw.records, raw.metadata.questions),
      records: raw.records
    };
  }
}

export function fetchSectoralImpacts(): Promise<SectoralImpactsData> {
  return getJson(`${API_BASE}/survey-impacts`);
}

function computeAnalytics(records: SurveyRecord[], questions: SurveyResponseData['metadata']['questions']) {
  const total = records.length;
  const stats: SurveyResponseData['analytics']['questions'] = {};

  for (const [questionId, question] of Object.entries(questions)) {
    const counts: Record<string, number> = {};
    let missingCount = 0;
    for (const record of records) {
      const answer = record.answers[questionId];
      if (!answer) missingCount += 1;
      else counts[answer] = (counts[answer] || 0) + 1;
    }
    stats[questionId] = {
      ...question,
      totalResponses: total - missingCount,
      missingCount,
      missingPercentage: Number(((missingCount / total) * 100).toFixed(1)),
      distribution: Object.entries(counts)
        .map(([option, count]) => ({ option, count, percentage: Number(((count / total) * 100).toFixed(1)) }))
        .sort((a, b) => b.count - a.count)
    };
  }

  const percent = (questionId: string, accepted: string[]) => {
    const count = records.filter((record) => accepted.includes(record.answers[questionId] || '')).length;
    return Number(((count / total) * 100).toFixed(1));
  };

  return {
    totalRecords: total,
    questions: stats,
    crossTabulations: { floodVsWaterShortage: {}, heatVsHealth: {}, problemVsAction: {} },
    compositeIndices: {
      heatPerceptionIndex: percent('Q2', ['Yes']),
      waterStressIndex: percent('Q5', ['Frequently', 'Sometimes']),
      ecoAgrarianIndex: percent('Q10', ['Yes']),
      publicReadinessIndex: percent('Q13', ['Very aware', 'Somewhat aware']),
      compositeVulnerabilityScore: Number(([
        percent('Q2', ['Yes']),
        percent('Q5', ['Frequently', 'Sometimes']),
        percent('Q10', ['Yes']),
        percent('Q7', ['Yes'])
      ].reduce((sum, value) => sum + value, 0) / 4).toFixed(1))
    }
  };
}
