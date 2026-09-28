import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache for external weather API calls (TTL: 5 minutes)
const weatherCache = new Map();
function getCached(key) {
  const item = weatherCache.get(key);
  if (item && Date.now() - item.timestamp < 5 * 60 * 1000) {
    return item.data;
  }
  return null;
}
function setCache(key, data) {
  weatherCache.set(key, { timestamp: Date.now(), data });
}

function sanitizeSurveyRecord(record, index) {
  return {
    id: record.id,
    respondentId: `Participant ${String(index + 1).padStart(2, '0')}`,
    rowNumber: record.rowNumber,
    pageNumber: record.pageNumber,
    sourceDoc: record.sourceDoc,
    timestamp: record.timestamp,
    answers: record.answers,
    missingCount: record.missingCount
  };
}

function publicSurveyRecords(records) {
  return records.map(sanitizeSurveyRecord);
}

// Load Survey Data
let surveyData = null;
function loadSurveyData() {
  const jsonPath = path.join(rootDir, 'data', 'survey_data.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      surveyData = JSON.parse(raw);
      console.log(`[Survey] Loaded ${surveyData.records.length} records from ${jsonPath}`);
    } catch (err) {
      console.error('[Survey] Error parsing survey_data.json:', err);
    }
  } else {
    console.warn(`[Survey] File not found at ${jsonPath}`);
  }
}
loadSurveyData();

// Serve the original PDF file
app.get('/RESPONSES.pdf', (req, res) => {
  const pdfPath = path.join(rootDir, 'RESPONSES.pdf');
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="RESPONSES.pdf"');
    fs.createReadStream(pdfPath).pipe(res);
  } else {
    res.status(404).json({ error: 'RESPONSES.pdf file not found' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dataMode: 'pdf-only',
    externalDataRequests: false,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    surveyRecordsLoaded: surveyData?.records?.length || 0,
    sourceFile: 'RESPONSES.pdf',
    sourcePdfAvailable: fs.existsSync(path.join(rootDir, 'RESPONSES.pdf'))
  });
});

// Calculate Survey Aggregate Statistics
function computeSurveyAnalytics(records) {
  if (!records || records.length === 0) return {};

  const total = records.length;
  const questions = surveyData.metadata.questions;
  const stats = {};

  for (const qKey of Object.keys(questions)) {
    const counts = {};
    let missing = 0;

    for (const r of records) {
      const ans = r.answers[qKey];
      if (ans === null || ans === undefined || ans === '') {
        missing++;
      } else {
        counts[ans] = (counts[ans] || 0) + 1;
      }
    }

    const distribution = Object.entries(counts).map(([option, count]) => ({
      option,
      count,
      percentage: Number(((count / total) * 100).toFixed(1))
    })).sort((a, b) => b.count - a.count);

    stats[qKey] = {
      id: qKey,
      num: questions[qKey].num,
      text: questions[qKey].text,
      category: questions[qKey].category,
      totalResponses: total - missing,
      missingCount: missing,
      missingPercentage: Number(((missing / total) * 100).toFixed(1)),
      distribution
    };
  }

  // Cross-Tabulation 1: Flooding Experience vs Water Shortage
  const floodVsWaterShortage = {};
  for (const r of records) {
    const flood = r.answers.Q4 || 'No Answer';
    const shortage = r.answers.Q5 || 'No Answer';
    const key = `${flood} Flooding | ${shortage} Shortage`;
    floodVsWaterShortage[key] = (floodVsWaterShortage[key] || 0) + 1;
  }

  // Cross-Tabulation 2: Heat Concern vs Health Issues
  const heatVsHealth = {
    'Hotter Summers & Health Problems': 0,
    'Hotter Summers & No Health Problems': 0,
    'Normal/Not Sure Summers & Health Problems': 0,
    'Normal/Not Sure Summers & No Health Problems': 0
  };
  for (const r of records) {
    const hotter = r.answers.Q2 === 'Yes';
    const health = r.answers.Q8 === 'Yes';
    if (hotter && health) heatVsHealth['Hotter Summers & Health Problems']++;
    else if (hotter && !health) heatVsHealth['Hotter Summers & No Health Problems']++;
    else if (!hotter && health) heatVsHealth['Normal/Not Sure Summers & Health Problems']++;
    else heatVsHealth['Normal/Not Sure Summers & No Health Problems']++;
  }

  // Cross-Tabulation 3: Biggest Problem vs Recommended Action
  const problemVsAction = {};
  for (const r of records) {
    const prob = r.answers.Q14 || 'Unspecified';
    const act = r.answers.Q15 || 'Unspecified';
    if (!problemVsAction[prob]) problemVsAction[prob] = {};
    problemVsAction[prob][act] = (problemVsAction[prob][act] || 0) + 1;
  }

  // Composite Risk Indices based on citizen perceptions
  // 1. Heat Stress Perception Index (Q1 + Q2 + Q8): 0-100
  const tempRisePct = (records.filter(r => r.answers.Q1 === 'Yes').length / total) * 100;
  const hotterSummersPct = (records.filter(r => r.answers.Q2 === 'Yes').length / total) * 100;
  const heatHealthPct = (records.filter(r => r.answers.Q8 === 'Yes').length / total) * 100;
  const heatPerceptionIndex = Number(((tempRisePct * 0.35) + (hotterSummersPct * 0.35) + (heatHealthPct * 0.30)).toFixed(1));

  // 2. Water Stress & Hydrology Risk Index (Q4 + Q5 + Q10): 0-100
  const floodAcute = (records.filter(r => r.answers.Q4 === 'Frequently' || r.answers.Q4 === 'Sometimes').length / total) * 100;
  const shortageAcute = (records.filter(r => r.answers.Q5 === 'Frequently' || r.answers.Q5 === 'Sometimes').length / total) * 100;
  const waterDepletion = (records.filter(r => r.answers.Q10 === 'Decreased').length / total) * 100;
  const waterStressIndex = Number(((floodAcute * 0.35) + (shortageAcute * 0.45) + (waterDepletion * 0.20)).toFixed(1));

  // 3. Ecological & Agrarian Impact Index (Q3 + Q9 + Q11): 0-100
  const rainShiftPct = (records.filter(r => r.answers.Q3 === 'Yes').length / total) * 100;
  const agriImpactPct = (records.filter(r => r.answers.Q9 === 'Yes').length / total) * 100;
  const airDegradationPct = (records.filter(r => r.answers.Q11 === 'Yes').length / total) * 100;
  const ecoAgrarianIndex = Number(((rainShiftPct * 0.35) + (agriImpactPct * 0.40) + (airDegradationPct * 0.25)).toFixed(1));

  // 4. Public Concern & Readiness Index (Q12 + Q13): 0-100
  const highConcernPct = (records.filter(r => r.answers.Q12 === 'Very Concerned' || r.answers.Q12 === 'Concerned').length / total) * 100;
  const awarenessPct = (records.filter(r => r.answers.Q13 === 'Yes').length / total) * 100;
  const publicReadinessIndex = Number(((highConcernPct * 0.5) + (awarenessPct * 0.5)).toFixed(1));

  // Overall Community Vulnerability Composite Index
  const compositeVulnerabilityScore = Number(((heatPerceptionIndex * 0.3) + (waterStressIndex * 0.35) + (ecoAgrarianIndex * 0.2) + ((100 - publicReadinessIndex * 0.5) * 0.15)).toFixed(1));

  return {
    totalRecords: total,
    questions: stats,
    crossTabulations: {
      floodVsWaterShortage,
      heatVsHealth,
      problemVsAction
    },
    compositeIndices: {
      heatPerceptionIndex,
      waterStressIndex,
      ecoAgrarianIndex,
      publicReadinessIndex,
      compositeVulnerabilityScore
    }
  };
}

// Complete Survey Endpoint
app.get('/api/survey', (req, res) => {
  if (!surveyData) {
    return res.status(500).json({ error: 'Survey data not loaded' });
  }

  const analytics = computeSurveyAnalytics(surveyData.records);

  res.json({
    provenance: {
      sourceFile: surveyData.metadata.sourceFile,
      totalPages: surveyData.metadata.totalPages,
      pageCitation: 'Page 1',
      totalSurveyRespondents: surveyData.records.length,
      surveyPeriod: surveyData.metadata.surveyDateRange,
      geographicScope: 'Not captured in the source questionnaire',
      notes: 'Public records are anonymized. Blank answers are preserved as null; no values are imputed.'
    },
    metadata: { ...surveyData.metadata, region: 'Not specified in source PDF' },
    analytics,
    records: publicSurveyRecords(surveyData.records)
  });
});

// Search & Filter Survey Records Endpoint
app.get('/api/survey/records', (req, res) => {
  if (!surveyData) return res.status(500).json({ error: 'Survey data not loaded' });

  const { search, concern, problem, action, flooding, waterShortage } = req.query;
  let filtered = [...surveyData.records];

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter((r, index) =>
      r.id.toLowerCase().includes(q) ||
      `participant ${String(index + 1).padStart(2, '0')}`.includes(q) ||
      Object.values(r.answers).some(val => val && String(val).toLowerCase().includes(q))
    );
  }

  if (concern && concern !== 'all') {
    filtered = filtered.filter(r => r.answers.Q12 === concern);
  }

  if (problem && problem !== 'all') {
    filtered = filtered.filter(r => r.answers.Q14 === problem);
  }

  if (action && action !== 'all') {
    filtered = filtered.filter(r => r.answers.Q15 === action);
  }

  if (flooding && flooding !== 'all') {
    filtered = filtered.filter(r => r.answers.Q4 === flooding);
  }

  if (waterShortage && waterShortage !== 'all') {
    filtered = filtered.filter(r => r.answers.Q5 === waterShortage);
  }

  res.json({
    totalMatched: filtered.length,
    records: filtered.map((record) => sanitizeSurveyRecord(record, surveyData.records.indexOf(record)))
  });
});

// Single Record by ID
app.get('/api/survey/record/:id', (req, res) => {
  if (!surveyData) return res.status(500).json({ error: 'Survey data not loaded' });
  const rec = surveyData.records.find(r => r.id === req.params.id || String(r.rowNumber) === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });

  res.json({
    citation: `RESPONSES.pdf, Page 1, Row ${rec.rowNumber}`,
    record: sanitizeSurveyRecord(rec, surveyData.records.indexOf(rec)),
    questions: surveyData.metadata.questions
  });
});

// Export Survey to CSV
app.get('/api/export/csv', (req, res) => {
  if (!surveyData) return res.status(500).send('No data available');

  const headers = [
    'ID', 'ParticipantID', 'RowNumber', 'PageNumber', 'SourceDoc', 'Timestamp',
    'Q1_TempChange', 'Q2_HotterSummers', 'Q3_RainfallChange', 'Q4_Flooding', 'Q5_WaterShortages',
    'Q6_ExtremeWeatherEvents', 'Q7_DailyActivitiesAffected', 'Q8_HeatHealthProblems',
    'Q9_AgriculturePlantsImpact', 'Q10_DrinkingWaterAvailability', 'Q11_AirQualityImpact',
    'Q12_ConcernLevel', 'Q13_AwarenessOfCauses', 'Q14_BiggestProblem', 'Q15_RecommendedAction'
  ];

  const csvRows = [headers.join(',')];

  for (const [index, r] of surveyData.records.entries()) {
    const row = [
      r.id,
      `"Participant ${String(index + 1).padStart(2, '0')}"`,
      r.rowNumber,
      r.pageNumber,
      `"${r.sourceDoc}"`,
      `"${r.timestamp || ''}"`,
      `"${r.answers.Q1 || ''}"`,
      `"${r.answers.Q2 || ''}"`,
      `"${r.answers.Q3 || ''}"`,
      `"${r.answers.Q4 || ''}"`,
      `"${r.answers.Q5 || ''}"`,
      `"${r.answers.Q6 || ''}"`,
      `"${r.answers.Q7 || ''}"`,
      `"${r.answers.Q8 || ''}"`,
      `"${r.answers.Q9 || ''}"`,
      `"${r.answers.Q10 || ''}"`,
      `"${r.answers.Q11 || ''}"`,
      `"${r.answers.Q12 || ''}"`,
      `"${r.answers.Q13 || ''}"`,
      `"${(r.answers.Q14 || '').replace(/"/g, '""')}"`,
      `"${(r.answers.Q15 || '').replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="climate_survey_responses.csv"');
  res.send(csvRows.join('\n'));
});

// This project intentionally operates in PDF-only mode. Keep external weather
// routes closed so neither the UI nor a direct request can trigger a provider call.
app.use('/api/weather', (_req, res) => {
  res.status(410).json({
    status: 'disabled',
    data: null,
    message: 'External weather and climate services are disabled. This application uses RESPONSES.pdf only.'
  });
});

// Legacy weather handlers retained below for implementation history; the
// PDF-only guard above makes them unreachable at runtime.
// Live Weather Endpoint (Open-Meteo Integration)
app.get('/api/weather/live', async (req, res) => {
  const lat = req.query.lat || '19.0760';
  const lon = req.query.lon || '72.8777';
  const locationName = req.query.name || 'Mumbai reference point';

  const cacheKey = `weather_live_${lat}_${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = new URL(process.env.OPEN_METEO_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
      timezone: 'auto'
    }).toString();
    const timeoutMs = Number(process.env.WEATHER_REQUEST_TIMEOUT_MS || 8000);
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
    const rawData = await response.json();

    const result = {
      source: 'Open-Meteo Weather API (ECMWF & GFS operational models)',
      attribution: 'Weather data provided by Open-Meteo.com under Creative Commons Attribution 4.0',
      status: 'live',
      isSimulated: false,
      timestamp: new Date().toISOString(),
      location: {
        name: locationName,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        elevation: rawData.elevation,
        timezone: rawData.timezone
      },
      current: rawData.current,
      dailyForecast: rawData.daily
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[Weather API] Error fetching live weather:', err.message);
    const snapshotPath = path.join(rootDir, 'data', 'weather_snapshot.json');
    const isDefaultReference = Math.abs(Number(lat) - 19.076) < 0.001 && Math.abs(Number(lon) - 72.8777) < 0.001;
    if (isDefaultReference && fs.existsSync(snapshotPath)) {
      const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
      return res.json({
        ...snapshot,
        status: 'cached-stale',
        message: 'The live provider could not be reached. These are last-known official Open-Meteo values and may be outdated.',
        lastLiveAttempt: new Date().toISOString(),
        location: { ...snapshot.location, name: locationName }
      });
    }
    res.status(503).json({
      status: 'unavailable',
      data: null,
      provider: 'Open-Meteo Forecast API',
      message: 'Live weather and forecast data are temporarily unavailable. No synthetic values are substituted.',
      checkedAt: new Date().toISOString()
    });
  }
});

// Air Quality Endpoint (Open-Meteo Air Quality API)
app.get('/api/weather/air-quality', async (req, res) => {
  const lat = req.query.lat || '19.0760';
  const lon = req.query.lon || '72.8777';

  const cacheKey = `aqi_${lat}_${lon}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = new URL(process.env.OPEN_METEO_AQI_URL || 'https://air-quality-api.open-meteo.com/v1/air-quality');
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi',
      timezone: 'auto'
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.WEATHER_REQUEST_TIMEOUT_MS || 8000)) });
    if (!response.ok) throw new Error(`AQI API returned ${response.status}`);
    const data = await response.json();

    const result = {
      source: 'Open-Meteo Air Quality Model (CAMS Copernicus Regional Ensemble)',
      attribution: 'Air quality data by Copernicus Atmosphere Monitoring Service via Open-Meteo',
      timestamp: new Date().toISOString(),
      current: data.current
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[AQI API] Error fetching air quality:', err.message);
    res.status(503).json({
      status: 'unavailable',
      data: null,
      provider: 'Open-Meteo Air Quality API',
      message: 'Air-quality data are temporarily unavailable. No synthetic values are substituted.',
      checkedAt: new Date().toISOString()
    });
  }
});

// Historical Climate Trends (verified ERA5 snapshot for a user-selectable reference location)
app.get('/api/weather/historical-trends', (req, res) => {
  const snapshotPath = path.join(rootDir, 'data', 'climate_snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    return res.status(503).json({
      status: 'unavailable',
      message: 'The verified historical climate snapshot is not available. Run the climate refresh pipeline.'
    });
  }

  try {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    const analytics = computeSurveyAnalytics(surveyData?.records || []);
    const answerPercentage = (question, option) =>
      analytics.questions?.[question]?.distribution?.find(item => item.option === option)?.percentage ?? null;

    res.json({
      provenance: {
        provider: snapshot.provenance.provider,
        dataset: snapshot.provenance.dataset,
        endpoint: snapshot.provenance.apiRequest,
        requestedAt: snapshot.provenance.retrievedAt,
        responseSha256: snapshot.provenance.responseSha256,
        latitude: snapshot.provenance.referenceLocation.latitude,
        longitude: snapshot.provenance.referenceLocation.longitude,
        locationLabel: snapshot.provenance.referenceLocation.name,
        locationRole: snapshot.provenance.locationRole,
        startDate: snapshot.provenance.period.start,
        endDate: snapshot.provenance.period.end,
        observations: snapshot.provenance.observationCount
      },
      methodology: {
        aggregation: snapshot.methodology.temperature,
        monsoonDefinition: snapshot.methodology.monsoonRainfall,
        extremeRainDefinition: snapshot.methodology.heavyRainDays,
        heatDayDefinition: snapshot.methodology.heatwaveDays,
        trendMethod: snapshot.methodology.trend
      },
      quality: {
        status: snapshot.quality.status,
        limitations: snapshot.quality.limitations
      },
      changes: {
        baselineDecade: snapshot.changes.baseline,
        recentPeriod: snapshot.changes.recent,
        meanAnnualTempC: snapshot.changes.meanAnnualTempC,
        summerPeakC: snapshot.changes.summerPeakC,
        monsoonRainfallMm: snapshot.changes.monsoonRainfallMm,
        extremeRainDaysPerYear: snapshot.changes.heavyRainDaysPerYear,
        heatDaysPerYear: snapshot.changes.heatDaysPerYear
      },
      trend: {
        meanAnnualTempCPerDecade: snapshot.trendsPerDecade.meanAnnualTempC,
        monsoonRainfallMmPerDecade: snapshot.trendsPerDecade.monsoonRainfallMm
      },
      decades: snapshot.decades,
      source: 'ERA5 reanalysis via Open-Meteo Historical Weather API',
      citation: 'Open-Meteo Historical Weather API, ERA5 model, Mumbai reference coordinate',
      surveyComparison: [
        {
          id: 'temperature-perception',
          label: 'Temperature perception vs. reanalysis',
          sourceQuestions: ['Q1', 'Q2'],
          surveyObservation: `${answerPercentage('Q1', 'Yes')}% noticed a temperature change; ${answerPercentage('Q2', 'Yes')}% reported hotter summers.`,
          reanalysisObservation: `ERA5 mean annual temperature changed by ${snapshot.changes.meanAnnualTempC > 0 ? '+' : ''}${snapshot.changes.meanAnnualTempC} C between ${snapshot.changes.baseline} and ${snapshot.changes.recent}.`,
          interpretation: 'The two sources point in the same direction. The survey has no respondent locations, so this is contextual alignment rather than causal validation.',
          confidence: 'aligned'
        },
        {
          id: 'rainfall-perception',
          label: 'Rainfall perception vs. reanalysis',
          sourceQuestions: ['Q3'],
          surveyObservation: `${answerPercentage('Q3', 'Yes')}% noticed a change in rainfall timing or amount.`,
          reanalysisObservation: `Mean monsoon rainfall changed by ${snapshot.changes.monsoonRainfallMm > 0 ? '+' : ''}${snapshot.changes.monsoonRainfallMm} mm, while >=100 mm rain days changed by ${snapshot.changes.heavyRainDaysPerYear > 0 ? '+' : ''}${snapshot.changes.heavyRainDaysPerYear} days/year.`,
          interpretation: 'This is a mixed signal: seasonal totals, timing and very-heavy-rain frequency are different indicators.',
          confidence: 'mixed'
        },
        {
          id: 'hydrology-perception',
          label: 'Flooding and water-shortage perception',
          sourceQuestions: ['Q4', 'Q5'],
          surveyObservation: `${answerPercentage('Q4', 'Frequently') + answerPercentage('Q4', 'Sometimes')}% reported flooding at least sometimes; ${answerPercentage('Q5', 'Frequently') + answerPercentage('Q5', 'Sometimes')}% reported water shortages at least sometimes.`,
          reanalysisObservation: 'The snapshot contains temperature and precipitation, not drainage, groundwater, land-cover, reservoirs or household supply.',
          interpretation: 'The co-occurrence is a survey finding; a physical explanation requires additional hydrology and infrastructure data.',
          confidence: 'not-assessed'
        }
      ],
      surveyCorrelation: {
        temperatureRise: {
          surveyObservation: `${answerPercentage('Q1', 'Yes')}% noticed a temperature change; ${answerPercentage('Q2', 'Yes')}% reported hotter summers.`,
          empiricalValidation: `ERA5 reference-grid mean annual temperature changed by ${snapshot.changes.meanAnnualTempC > 0 ? '+' : ''}${snapshot.changes.meanAnnualTempC} C between ${snapshot.changes.baseline} and ${snapshot.changes.recent}.`,
          status: 'Contextually aligned; not causal validation'
        },
        erraticRainfall: {
          surveyObservation: `${answerPercentage('Q3', 'Yes')}% noticed a change in rainfall timing or amount.`,
          empiricalValidation: `Reference-grid monsoon rainfall changed by ${snapshot.changes.monsoonRainfallMm > 0 ? '+' : ''}${snapshot.changes.monsoonRainfallMm} mm; this does not measure rainfall timing.`,
          status: 'Mixed evidence'
        },
        waterShortagesVsFloods: {
          surveyObservation: `${answerPercentage('Q4', 'Frequently') + answerPercentage('Q4', 'Sometimes')}% reported flooding at least sometimes; ${answerPercentage('Q5', 'Frequently') + answerPercentage('Q5', 'Sometimes')}% reported water shortages at least sometimes.`,
          empiricalValidation: 'Not assessed by the available temperature and precipitation snapshot.',
          status: 'Additional hydrology and infrastructure data required'
        }
      }
    });
  } catch (error) {
    console.error('[Climate Snapshot] Invalid snapshot:', error.message);
    res.status(503).json({ status: 'unavailable', message: 'The historical climate snapshot failed integrity checks.' });
  }
});

// Geocoding Search Endpoint
app.get('/api/weather/geocode', async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) return res.json({ results: [] });

  try {
    const url = new URL(process.env.OPEN_METEO_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name: String(query), count: '6', language: 'en', format: 'json' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.WEATHER_REQUEST_TIMEOUT_MS || 8000)) });
    if (!response.ok) throw new Error(`Geocoding API returned ${response.status}`);
    const data = await response.json();
    res.json({ results: data.results || [] });
  } catch {
    res.status(503).json({ error: 'Geocoding service unavailable', message: 'Location search is temporarily unavailable.' });
  }
});

// Sectoral Climate Impact Engine & Recommendations
app.get(['/api/survey-impacts', '/api/climate-impacts'], (req, res) => {
  const analytics = computeSurveyAnalytics(surveyData?.records || []);
  const pct = (question, options) => {
    const distributions = analytics.questions?.[question]?.distribution || [];
    return Number(distributions
      .filter(item => options.includes(item.option))
      .reduce((sum, item) => sum + item.percentage, 0)
      .toFixed(1));
  };
  const priorityScore = (...values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const flooding = pct('Q4', ['Frequently', 'Sometimes']);
  const shortages = pct('Q5', ['Frequently', 'Sometimes']);
  const hotterSummers = pct('Q2', ['Yes']);
  const heatHealth = pct('Q8', ['Yes']);
  const agriculture = pct('Q9', ['Yes']);
  const rainfallChange = pct('Q3', ['Yes']);
  const dailyDisruption = pct('Q7', ['Yes']);
  const airConcern = pct('Q11', ['Yes']);
  const sectors = [
    {
      id: 'water',
      sector: 'Water Resources & Hydrology',
      icon: 'Droplets',
      riskLevel: 'High survey priority',
      riskScore: priorityScore(flooding, shortages),
      surveyEvidence: `${shortages}% report water shortages and ${flooding}% report flooding or waterlogging at least sometimes (Q5 and Q4, PDF p.1).`,
      scientificBasis: 'Interpretation: simultaneous flood and shortage reports justify examining drainage, storage and groundwater resilience; the PDF alone does not establish the mechanism.',
      projectedRisks: [
        'Service interruptions during dry periods',
        'Water contamination where flooding reaches supply systems',
        'Higher household dependence on emergency water access'
      ],
      interventions: [
        'Mandatory rainwater harvesting for residential and commercial structures',
        'Percolation pits and bio-swales to recharge groundwater aquifers',
        'Automated real-time level and quality monitoring across distribution networks'
      ],
      surveyRecommendationAlignment: `${pct('Q15', ['Water Conservation'])}% selected Water Conservation as the preferred action.`
    },
    {
      id: 'heat-health',
      sector: 'Public Health & Heat Vulnerability',
      icon: 'ThermometerSun',
      riskLevel: 'Elevated survey priority',
      riskScore: priorityScore(hotterSummers, heatHealth),
      surveyEvidence: `${heatHealth}% report heat-related health problems and ${hotterSummers}% perceive hotter summers (Q8 and Q2, PDF p.1).`,
      scientificBasis: 'Interpretation: perceived heat and reported health effects support preparedness. Medical attribution and official heatwave classification require health and station data not present here.',
      projectedRisks: [
        'Surge in heat-exhaustion and renal stress among outdoor/daily-wage laborers',
        'Loss of safe outdoor work hours on hot days',
        'Higher risk for older adults, children and outdoor workers'
      ],
      interventions: [
        'Establishment of municipal "Cool Roofs" and shaded public transit shelters',
        'Community Heat Action Plan (HAP) with tiered heatwave sirens and color-coded alerts',
        'Equipping primary health centers with dedicated oral rehydration and cooling pods'
      ],
      surveyRecommendationAlignment: `${pct('Q15', ['Tree Plantation'])}% selected Tree Plantation; cool roofs, shade and heat alerts are analyst recommendations.`
    },
    {
      id: 'agriculture',
      sector: 'Agriculture, Horticulture & Plant Life',
      icon: 'Sprout',
      riskLevel: 'Elevated survey priority',
      riskScore: priorityScore(agriculture, rainfallChange),
      surveyEvidence: `${agriculture}% perceive effects on agriculture or plants and ${rainfallChange}% notice rainfall changes (Q9 and Q3, PDF p.1).`,
      scientificBasis: 'Interpretation: crops can be sensitive to heat and rainfall timing. Crop-specific effects need location, crop calendar, soil and yield observations not collected by this survey.',
      projectedRisks: [
        'Plant stress during hotter or drier periods',
        'Sowing and harvesting disruption if rainfall timing shifts',
        'Topsoil loss during high-intensity rainfall'
      ],
      interventions: [
        'Subsidized transition to climate-resilient crop varieties (drought/flood tolerant seeds)',
        'Micro-drip irrigation infrastructure coupled with weather-indexed micro-insurance',
        'Expansion of agro-forestry and buffer vegetative strips to prevent topsoil loss'
      ],
      surveyRecommendationAlignment: `Tree Plantation (${pct('Q15', ['Tree Plantation'])}%) and Water Conservation (${pct('Q15', ['Water Conservation'])}%) are the two most selected relevant actions.`
    },
    {
      id: 'infrastructure',
      sector: 'Urban Infrastructure & Mobility',
      icon: 'Building2',
      riskLevel: 'High survey priority',
      riskScore: priorityScore(dailyDisruption, flooding),
      surveyEvidence: `${dailyDisruption}% report effects on daily activities and ${flooding}% report flooding or waterlogging at least sometimes (Q7 and Q4, PDF p.1).`,
      scientificBasis: 'Interpretation: repeated disruption supports drainage and continuity planning. The survey does not contain asset locations, design capacity or damage records.',
      projectedRisks: [
        'Transport delay and access disruption during waterlogging',
        'Damage to ground-floor assets in repeatedly flooded areas',
        'Utility interruptions where exposed infrastructure is inundated'
      ],
      interventions: [
        'Desilting and widening of arterial stormwater nullahs before June 1 annually',
        'Installation of high-capacity flood pumping stations equipped with tidal flap gates',
        'Permeable pavement mandates for municipal sidewalks and open parking facilities'
      ],
      surveyRecommendationAlignment: `${pct('Q14', ['Flooding'])}% selected Flooding as the biggest problem; ${pct('Q15', ['Waste Management'])}% selected Waste Management.`
    },
    {
      id: 'air-quality',
      sector: 'Air Quality & Atmospheric Environment',
      icon: 'Wind',
      riskLevel: 'Elevated survey priority',
      riskScore: airConcern,
      surveyEvidence: `${airConcern}% perceive an air-quality effect and ${pct('Q14', ['Air Pollution'])}% select Air Pollution as the biggest local problem (Q11 and Q14, PDF p.1).`,
      scientificBasis: 'Interpretation: perception indicates concern, while real-time modeled AQI provides context. Source attribution requires emissions and monitoring-station evidence not in the PDF.',
      projectedRisks: [
        'Respiratory discomfort during poor-air episodes',
        'Reduced visibility during particulate pollution events',
        'Compounded discomfort when heat and pollution coincide'
      ],
      interventions: [
        'Accelerated adoption of electric public transit buses and clean fleet incentives',
        'Strict dust suppression protocols on all ongoing urban construction and road works',
        'Continuous ambient air monitoring stations with publicly broadcasted Air Quality Alerts'
      ],
      surveyRecommendationAlignment: `Public Awareness (${pct('Q15', ['Public Awareness'])}%) and Renewable Energy (${pct('Q15', ['Renewable Energy'])}%) are related respondent-selected actions.`
    }
  ];

  res.json({
    framework: 'Educational sector-priority synthesis',
    methodology: 'Scores are transparent arithmetic means of relevant survey-response percentages, not official risk probabilities. Effects are conditional analyst scenarios, not predictions.',
    sectors
  });
});

// Serve frontend in production
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Climate Intelligence Server running on http://localhost:${PORT}`);
});
