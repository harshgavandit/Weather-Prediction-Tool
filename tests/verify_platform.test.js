import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Climate Intelligence Platform - Data & API Validation', () => {
  const jsonPath = path.join(rootDir, 'data', 'survey_data.json');
  const pdfPath = path.join(rootDir, 'RESPONSES.pdf');

  test('PDF source file exists and is intact', () => {
    assert.ok(fs.existsSync(pdfPath), 'RESPONSES.pdf must exist in project root');
    const stats = fs.statSync(pdfPath);
    assert.ok(stats.size > 20000, `PDF size should be > 20KB, got ${stats.size} bytes`);
  });

  test('Survey JSON dataset exists and contains expected metadata', () => {
    assert.ok(fs.existsSync(jsonPath), 'survey_data.json must exist');
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    assert.equal(data.metadata.sourceFile, 'RESPONSES.pdf');
    assert.equal(data.metadata.totalPages, 1);
    assert.equal(data.records.length, 51, 'Should have exactly 51 valid respondent records');
    assert.equal(Object.keys(data.metadata.questions).length, 15, 'Should have 15 question definitions');
  });

  test('Data integrity: natural non-responses preserved without fabrication', () => {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    // Row 1 (Aayush) skipped Q7
    const row1 = data.records.find(r => r.rowNumber === 1);
    assert.ok(row1, 'Row 1 should exist');
    assert.equal(row1.answers.Q7, null, 'Row 1 Q7 should be null (unfabricated non-response)');
    assert.equal(row1.missingCount, 1);

    // Row 17 (Manisha) skipped Q12 and Q13
    const row17 = data.records.find(r => r.rowNumber === 17);
    assert.ok(row17, 'Row 17 should exist');
    assert.equal(row17.answers.Q12, null, 'Row 17 Q12 should be null (unfabricated non-response)');
    assert.equal(row17.answers.Q13, null, 'Row 17 Q13 should be null (unfabricated non-response)');
    assert.equal(row17.missingCount, 2);

    // All other 49 records have all 15 questions answered
    const fullRecords = data.records.filter(r => r.missingCount === 0);
    assert.equal(fullRecords.length, 49, '49 records should have all 15 questions answered');
  });

  test('Quantitative survey calculations match expected distribution', () => {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);
    const records = data.records;

    // Q1: Temperature change noticed (43 Yes = 84.3%)
    const q1Yes = records.filter(r => r.answers.Q1 === 'Yes').length;
    assert.equal(q1Yes, 43);
    const q1Pct = ((q1Yes / records.length) * 100).toFixed(1);
    assert.equal(q1Pct, '84.3');

    // Q2: Summers hotter than before (35 Yes = 68.6%)
    const q2Yes = records.filter(r => r.answers.Q2 === 'Yes').length;
    assert.equal(q2Yes, 35);
    const q2Pct = ((q2Yes / records.length) * 100).toFixed(1);
    assert.equal(q2Pct, '68.6');

    // Q14: Biggest Problem - Heat should be #1
    const problemCounts = {};
    records.forEach(r => {
      if (r.answers.Q14) problemCounts[r.answers.Q14] = (problemCounts[r.answers.Q14] || 0) + 1;
    });
    assert.equal(problemCounts['Heat'], 14);
    assert.equal(problemCounts['Water Shortage'], 12);
    assert.equal(problemCounts['Flooding'], 11);

    // Q15: Recommended Action - Tree Plantation should be #1
    const actionCounts = {};
    records.forEach(r => {
      if (r.answers.Q15) actionCounts[r.answers.Q15] = (actionCounts[r.answers.Q15] || 0) + 1;
    });
    assert.equal(actionCounts['Tree Plantation'], 20);
    assert.equal(actionCounts['Water Conservation'], 11);
  });

  test('Production build output exists and contains essential assets', () => {
    const distHtml = path.join(rootDir, 'dist', 'index.html');
    assert.ok(fs.existsSync(distHtml), 'dist/index.html must exist');
    const htmlContent = fs.readFileSync(distHtml, 'utf-8');
    assert.ok(htmlContent.includes('ClimateIntel'), 'Built HTML should include platform branding');
  });
});
