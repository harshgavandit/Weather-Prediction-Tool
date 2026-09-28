import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = 'http://localhost:3001';

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    const req = http.request(fullUrl, options, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        const text = data.toString('utf-8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text,
          json,
          bytes: data.length
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END VERIFICATION: CLIMATEINTEL');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      if (details) console.log(`     ↳ ${details}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     ↳ Error: ${details}`);
      failed++;
    }
  }

  // 1. Static Web Application Delivery
  console.log('👉 STEP 1: Verifying Web App Delivery & HTML Shell');
  const indexRes = await fetchUrl('/');
  report(
    'Root / serves HTTP 200 with HTML content-type',
    indexRes.status === 200 && indexRes.headers['content-type']?.includes('text/html'),
    `Status: ${indexRes.status}, Content-Type: ${indexRes.headers['content-type']}`
  );
  report(
    'HTML contains ClimateIntel branding, Leaflet CSS & bundle scripts',
    indexRes.text.includes('ClimateIntel') && indexRes.text.includes('leaflet') && indexRes.text.includes('/assets/index'),
    `HTML Size: ${indexRes.bytes} bytes`
  );

  // 2. Original PDF Delivery & Direct In-Browser Inspection
  console.log('\n👉 STEP 2: Verifying PDF In-Browser Delivery & Integrity');
  const pdfRes = await fetchUrl('/RESPONSES.pdf');
  report(
    '/RESPONSES.pdf serves original PDF with application/pdf header',
    pdfRes.status === 200 && pdfRes.headers['content-type'] === 'application/pdf',
    `Size: ${pdfRes.bytes} bytes`
  );
  report(
    'PDF file size matches original on-disk asset (31,494 bytes)',
    pdfRes.bytes === 31494,
    `Delivered ${pdfRes.bytes} bytes`
  );

  // 3. API Health & Database Readiness
  console.log('\n👉 STEP 3: Verifying API Health & In-Memory Dataset');
  const healthRes = await fetchUrl('/api/health');
  report(
    'GET /api/health responds with 200 OK and status: "ok"',
    healthRes.status === 200 && healthRes.json?.status === 'ok',
    `Uptime: ${healthRes.json?.uptime.toFixed(1)}s`
  );
  report(
    'API loaded exactly 51 survey records from RESPONSES.pdf',
    healthRes.json?.surveyRecordsLoaded === 51,
    `Records: ${healthRes.json?.surveyRecordsLoaded}`
  );

  // 4. Survey Dataset & Statistical Calculations
  console.log('\n👉 STEP 4: Verifying Full Survey Dataset & Mathematical Analysis');
  const surveyRes = await fetchUrl('/api/survey');
  const sData = surveyRes.json;
  report(
    'GET /api/survey contains provenance metadata and 51 records',
    sData && sData.records?.length === 51 && sData.provenance?.sourceFile === 'RESPONSES.pdf',
    `Extracted records: ${sData?.records?.length}`
  );

  // Verify non-fabrication in Row 1 and Row 17
  const r1 = sData?.records.find((r) => r.rowNumber === 1);
  const r17 = sData?.records.find((r) => r.rowNumber === 17);
  report(
    'Zero-Fabrication Integrity: Row 1 has Q7 as null (authentic omission preserved)',
    r1 && r1.answers.Q7 === null && r1.missingCount === 1,
    `Row 1 answers: Q7 = ${r1?.answers.Q7}`
  );
  report(
    'Zero-Fabrication Integrity: Row 17 has Q12 & Q13 as null (authentic omissions preserved)',
    r17 && r17.answers.Q12 === null && r17.answers.Q13 === null && r17.missingCount === 2,
    `Row 17 answers: Q12 = ${r17?.answers.Q12}, Q13 = ${r17?.answers.Q13}`
  );

  // Verify Calculations
  const q1Dist = sData?.analytics?.questions?.Q1?.distribution;
  const q1Yes = q1Dist?.find((d) => d.option === 'Yes');
  report(
    'Question 1 (Warming Trend): 43 / 51 = 84.3% noticed change',
    q1Yes && q1Yes.count === 43 && q1Yes.percentage === 84.3,
    `Q1 Yes: ${q1Yes?.count} (${q1Yes?.percentage}%)`
  );

  const q14Dist = sData?.analytics?.questions?.Q14?.distribution;
  const topProblem = q14Dist?.[0];
  report(
    'Question 14 (Biggest Problem): Heat ranked #1 with 14 votes (27.5%)',
    topProblem && topProblem.option === 'Heat' && topProblem.count === 14,
    `Top problem: ${topProblem?.option} (${topProblem?.percentage}%)`
  );

  const q15Dist = sData?.analytics?.questions?.Q15?.distribution;
  const topAction = q15Dist?.[0];
  report(
    'Question 15 (Recommended Action): Tree Plantation ranked #1 with 20 votes (39.2%)',
    topAction && topAction.option === 'Tree Plantation' && topAction.count === 20,
    `Top action: ${topAction?.option} (${topAction?.percentage}%)`
  );

  // 5. Search and Dynamic Filtering
  console.log('\n👉 STEP 5: Verifying Search & Query Filtering');
  const searchRes = await fetchUrl('/api/survey/records?search=Aayush');
  report(
    'Search by name "Aayush" returns matching records',
    searchRes.json?.totalMatched >= 1 && searchRes.json?.records[0]?.name.includes('Aayush'),
    `Matched: ${searchRes.json?.totalMatched} records`
  );

  const filterRes = await fetchUrl('/api/survey/records?concern=Very%20Concerned&flooding=Frequently');
  report(
    'Multi-criteria filter (Very Concerned + Frequently Flooded) executes accurately',
    filterRes.json?.records?.every((r) => r.answers.Q12 === 'Very Concerned' && r.answers.Q4 === 'Frequently'),
    `Matched ${filterRes.json?.totalMatched} intersecting records`
  );

  // 6. Live Meteorological & Open-Meteo Sync
  console.log('\n👉 STEP 6: Verifying Weather Integration (Open-Meteo / ECMWF)');
  const weatherRes = await fetchUrl('/api/weather/live?lat=19.0760&lon=72.8777');
  const wData = weatherRes.json;
  report(
    'GET /api/weather/live returns real-time ambient parameters',
    wData && wData.current?.temperature_2m !== undefined && wData.current?.relative_humidity_2m !== undefined,
    `Temp: ${wData?.current?.temperature_2m}°C, Humidity: ${wData?.current?.relative_humidity_2m}%, Apparent: ${wData?.current?.apparent_temperature}°C`
  );
  report(
    'Weather forecast contains 7 daily projections with precipitation and max/min temps',
    wData?.dailyForecast?.time?.length >= 7 && wData?.dailyForecast?.temperature_2m_max?.length >= 7,
    `Forecast days: ${wData?.dailyForecast?.time?.length}`
  );

  // 7. Air Quality Telemetry
  console.log('\n👉 STEP 7: Verifying Air Quality Telemetry (CAMS)');
  const aqiRes = await fetchUrl('/api/weather/air-quality?lat=19.0760&lon=72.8777');
  const aData = aqiRes.json;
  report(
    'GET /api/weather/air-quality returns US AQI and PM2.5 concentrations',
    aData && aData.current?.us_aqi !== undefined && aData.current?.pm2_5 !== undefined,
    `US AQI: ${aData?.current?.us_aqi}, PM2.5: ${aData?.current?.pm2_5} µg/m³`
  );

  // 8. Historical Decadal Reanalysis
  console.log('\n👉 STEP 8: Verifying 40-Year ERA5 Climate Reanalysis');
  const histRes = await fetchUrl('/api/weather/historical-trends');
  const hData = histRes.json;
  report(
    'Historical trends API returns 5 decades of empirical ERA5 metrics (1981–2025)',
    hData?.decades?.length === 5,
    `Decades: ${hData?.decades?.map((d) => d.decade).join(', ')}`
  );
  report(
    'Historical warming verifies survey: Summer peak temperature elevated from 34.2°C to 36.8°C',
    hData?.decades?.[0]?.summerPeakAvg === 34.2 && hData?.decades?.[4]?.summerPeakAvg === 36.8,
    `Baseline: 34.2°C -> Present: 36.8°C (+2.6°C rise)`
  );

  // 9. Sectoral Impacts & IPCC Framework
  console.log('\n👉 STEP 9: Verifying Sectoral Climate Impact Engine');
  const sectorRes = await fetchUrl('/api/climate-impacts');
  const secData = sectorRes.json;
  report(
    'Climate impacts API covers all 5 key societal sectors',
    secData?.sectors?.length === 5,
    `Sectors: ${secData?.sectors?.map((s) => s.id).join(', ')}`
  );
  report(
    'Water Resources sector identifies the Hydrological Whip (High Risk Score >= 80)',
    secData?.sectors?.find((s) => s.id === 'water')?.riskScore >= 80,
    `Water risk score: ${secData?.sectors?.find((s) => s.id === 'water')?.riskScore}`
  );

  // 10. Data Export & CSV Download
  console.log('\n👉 STEP 10: Verifying CSV Data Export');
  const csvRes = await fetchUrl('/api/export/csv');
  report(
    'GET /api/export/csv streams text/csv attachment with 52 lines (header + 51 records)',
    csvRes.status === 200 && csvRes.headers['content-type']?.includes('text/csv') && csvRes.text.split('\n').length === 52,
    `Lines: ${csvRes.text.split('\n').length}, Header: ${csvRes.text.split('\n')[0].slice(0, 45)}...`
  );

  // Summary
  console.log('\n====================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEndToEndVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
