import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let serverProcess;
const PORT = 3009; // separate test port

function requestJson(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    }).on('error', reject);
  });
}

describe('Climate Intelligence Backend API Endpoints', () => {
  before(async () => {
    // Start server process on PORT 3009
    serverProcess = spawn('node', ['server/index.js'], {
      cwd: rootDir,
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'pipe'
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      serverProcess.stdout.on('data', (d) => {
        if (d.toString().includes('Climate Intelligence Server running')) {
          resolve();
        }
      });
      serverProcess.stderr.on('data', (d) => console.error('[Server Err]', d.toString()));
      setTimeout(() => reject(new Error('Server start timed out')), 5000);
    });
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test('GET /api/health returns 200 with status ok and survey records count', async () => {
    const res = await requestJson('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
    assert.equal(res.data.surveyRecordsLoaded, 51);
  });

  test('GET /api/survey returns structured dataset, provenance, and analytics', async () => {
    const res = await requestJson('/api/survey');
    assert.equal(res.status, 200);
    assert.equal(res.data.records.length, 51);
    assert.equal(res.data.provenance.sourceFile, 'RESPONSES.pdf');
    assert.ok(res.data.analytics.questions.Q14);
    assert.ok(res.data.analytics.compositeIndices.compositeVulnerabilityScore > 0);
  });

  test('GET /api/survey/records filters by concern level accurately', async () => {
    const res = await requestJson('/api/survey/records?concern=Very%20Concerned');
    assert.equal(res.status, 200);
    assert.equal(res.data.totalMatched, 21);
    res.data.records.forEach(r => {
      assert.equal(r.answers.Q12, 'Very Concerned');
    });
  });

  test('GET /api/weather/live remains disabled without contacting a provider', async () => {
    const res = await requestJson('/api/weather/live?lat=19.076&lon=72.8777');
    assert.equal(res.status, 410);
    assert.equal(res.data.status, 'disabled');
    assert.equal(res.data.data, null);
  });

  test('GET /api/weather/historical-trends remains disabled in PDF-only mode', async () => {
    const res = await requestJson('/api/weather/historical-trends');
    assert.equal(res.status, 410);
    assert.equal(res.data.status, 'disabled');
    assert.match(res.data.message, /RESPONSES.pdf only/);
  });

  test('GET /api/climate-impacts returns all 5 sectoral assessments', async () => {
    const res = await requestJson('/api/climate-impacts');
    assert.equal(res.status, 200);
    assert.equal(res.data.sectors.length, 5);
    const sectors = res.data.sectors.map(s => s.id);
    assert.ok(sectors.includes('water'));
    assert.ok(sectors.includes('heat-health'));
    assert.ok(sectors.includes('agriculture'));
    assert.ok(sectors.includes('infrastructure'));
    assert.ok(sectors.includes('air-quality'));
  });

  test('GET /RESPONSES.pdf serves the original PDF with application/pdf header', async () => {
    const res = await requestJson('/RESPONSES.pdf');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'application/pdf');
  });

});
