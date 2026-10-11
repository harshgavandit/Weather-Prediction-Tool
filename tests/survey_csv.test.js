import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSurveyCsv } from '../shared/surveyCsv.js';

const records = JSON.parse(fs.readFileSync(new URL('../public/data/survey_data.json', import.meta.url))).records;

test('CSV exports only the supplied filtered records, in their displayed order', () => {
  const selected = records.filter(record => record.answers.Q14 === 'Heat').reverse();
  const lines = createSurveyCsv(selected).split('\r\n');
  assert.equal(selected.length, 14);
  assert.equal(lines.length, 15);
  selected.forEach((record, index) => {
    assert.equal(lines[index + 1].split(',')[0], `"${record.id}"`);
  });
  assert.equal(lines[0].split(',').length, 21);
  assert.match(lines[0], /ParticipantID,RowNumber,PageNumber,SourceDoc,Timestamp/);
});

test('CSV preserves PDF omissions as empty cells and includes only public fields', () => {
  const record = records.find(item => item.rowNumber === 17);
  const csv = createSurveyCsv([{ ...record, name: 'PRIVATE NAME', email: 'private@example.com', phone: 'PRIVATE PHONE' }]);
  const cells = csv.split('\r\n')[1].split(',');
  assert.equal(cells[17], '""'); // Q12
  assert.equal(cells[18], '""'); // Q13
  assert.equal(cells[2], '"17"');
  assert.equal(cells[3], '"1"');
  assert.equal(cells[4], '"RESPONSES.pdf"');
  assert.doesNotMatch(csv, /PRIVATE|private@example.com/);
});

test('CSV quotes commas, quotes and newlines without modifying the records', () => {
  const record = { ...records[0], answers: { ...records[0].answers, Q15: 'Plant trees, "locally"\nConserve water' } };
  const original = JSON.stringify(record);
  assert.ok(createSurveyCsv([record]).includes('"Plant trees, ""locally""\nConserve water"'));
  assert.equal(JSON.stringify(record), original);
});

test('CSV neutralizes spreadsheet formula prefixes including leading whitespace', () => {
  for (const answer of ['=1+1', '+1+1', '-1+1', '@SUM(A1)', '  =1+1', '\t=1+1', '\r=1+1', '\n=1+1']) {
    const record = { ...records[0], answers: { ...records[0].answers, Q15: answer } };
    assert.ok(createSurveyCsv([record]).endsWith(`"'${answer}"`));
  }
});

test('CSV with no matching records contains only column headers', () => {
  const csv = createSurveyCsv([]);
  assert.equal(csv.split('\r\n').length, 1);
  assert.ok(csv.startsWith('ID,ParticipantID,'));
});
