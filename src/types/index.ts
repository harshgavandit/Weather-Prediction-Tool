export interface QuestionInfo {
  id: string;
  num: number;
  text: string;
  category: string;
}

export interface SurveyRecord {
  id: string;
  respondentId: string;
  rowNumber: number;
  pageNumber: number;
  sourceDoc: string;
  timestamp: string;
  answers: {
    Q1: string | null;
    Q2: string | null;
    Q3: string | null;
    Q4: string | null;
    Q5: string | null;
    Q6: string | null;
    Q7: string | null;
    Q8: string | null;
    Q9: string | null;
    Q10: string | null;
    Q11: string | null;
    Q12: string | null;
    Q13: string | null;
    Q14: string | null;
    Q15: string | null;
    [key: string]: string | null;
  };
  missingCount: number;
}

export interface OptionDistribution {
  option: string;
  count: number;
  percentage: number;
}

export interface QuestionStat {
  id: string;
  num: number;
  text: string;
  category: string;
  totalResponses: number;
  missingCount: number;
  missingPercentage: number;
  distribution: OptionDistribution[];
}

export interface CompositeIndices {
  heatPerceptionIndex: number;
  waterStressIndex: number;
  ecoAgrarianIndex: number;
  publicReadinessIndex: number;
  compositeVulnerabilityScore: number;
}

export interface SurveyAnalytics {
  totalRecords: number;
  questions: Record<string, QuestionStat>;
  crossTabulations: {
    floodVsWaterShortage: Record<string, number>;
    heatVsHealth: Record<string, number>;
    problemVsAction: Record<string, Record<string, number>>;
  };
  compositeIndices: CompositeIndices;
}

export interface SurveyResponseData {
  provenance: {
    sourceFile: string;
    totalPages: number;
    pageCitation: string;
    totalSurveyRespondents: number;
    surveyPeriod: { start: string; end: string };
    geographicScope: string;
    notes: string;
  };
  metadata: {
    sourceFile: string;
    totalPages: number;
    totalExtractedRecords: number;
    surveyDateRange: { start: string; end: string };
    region: string;
    questions: Record<string, QuestionInfo>;
  };
  analytics: SurveyAnalytics;
  records: SurveyRecord[];
}

export interface LiveWeatherData {
  source: string;
  attribution: string;
  status?: 'live' | 'cached-stale';
  message?: string;
  isSimulated: boolean;
  timestamp: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    timezone?: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    surface_pressure?: number;
  };
  dailyForecast: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max?: number[];
    apparent_temperature_min?: number[];
    precipitation_sum: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    uv_index_max?: number[];
  };
}

export interface AirQualityData {
  source: string;
  attribution: string;
  timestamp: string;
  current: {
    time: string;
    pm10: number;
    pm2_5: number;
    carbon_monoxide?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    us_aqi: number;
    european_aqi: number;
  };
}

export interface DecadalClimateMetric {
  decade: string;
  meanAnnualTemp: number;
  summerPeakAvg: number;
  monsoonRainfallMm: number;
  extremeRainDaysPerYear: number;
  heatwaveDaysPerYear: number;
}

export interface HistoricalTrendsData {
  source: string;
  citation: string;
  provenance: {
    provider: string;
    dataset: string;
    endpoint: string;
    requestedAt: string;
    responseSha256: string;
    latitude: number;
    longitude: number;
    locationLabel: string;
    locationRole: string;
    startDate: string;
    endDate: string;
    observations: number;
  };
  methodology: {
    aggregation: string;
    monsoonDefinition: string;
    extremeRainDefinition: string;
    heatDayDefinition: string;
    trendMethod: string;
  };
  quality: {
    status: string;
    limitations: string[];
  };
  changes: {
    baselineDecade: string;
    recentPeriod: string;
    meanAnnualTempC: number;
    summerPeakC: number;
    monsoonRainfallMm: number;
    extremeRainDaysPerYear: number;
    heatDaysPerYear: number;
  };
  trend: {
    meanAnnualTempCPerDecade: number;
    monsoonRainfallMmPerDecade: number;
  };
  surveyComparison: Array<{
    id: string;
    label: string;
    sourceQuestions: string[];
    surveyObservation: string;
    reanalysisObservation: string;
    interpretation: string;
    confidence: 'aligned' | 'mixed' | 'not-assessed';
  }>;
  decades: DecadalClimateMetric[];
}

export interface SectorImpact {
  id: string;
  sector: string;
  icon: string;
  riskLevel: string;
  riskScore: number;
  surveyEvidence: string;
  scientificBasis: string;
  projectedRisks: string[];
  interventions: string[];
  surveyRecommendationAlignment: string;
}

export interface SectoralImpactsData {
  framework: string;
  methodology: string;
  sectors: SectorImpact[];
}

export type PhotoEvidenceCategory = 'Heat' | 'Flooding' | 'Water shortage' | 'Agriculture' | 'Environment' | 'Infrastructure' | 'Waste' | 'Other';
export type PhotoEvidenceStatus = 'pending' | 'verified' | 'rejected';
export type PhotoLocationSource = 'exif' | 'device' | 'manual' | 'unavailable';

export interface PhotoEvidence {
  id: string;
  participant: {
    id: string;
    label: string;
    rowNumber: number;
    pageNumber: number;
  };
  title: string;
  description: string;
  category: PhotoEvidenceCategory;
  status: PhotoEvidenceStatus;
  location: {
    latitude: number | null;
    longitude: number | null;
    source: PhotoLocationSource;
    accuracyMeters: number | null;
    label: string;
  };
  capturedAt: string | null;
  uploadedAt: string;
  updatedAt: string;
  fieldEvidence: true;
  file: {
    safeOriginalName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
  };
  imageUrl: string;
}

export interface PhotoEvidenceSummary {
  total: number;
  verified: number;
  withCoordinates: number;
  participantsWithEvidence: number;
  byCategory: Array<{ category: PhotoEvidenceCategory; count: number }>;
}

export interface PhotoEvidenceResponse {
  items: PhotoEvidence[];
  summary: PhotoEvidenceSummary;
}

export type ProvenanceType = 'source' | 'calculated' | 'ai' | 'citizen' | 'scenario';
