import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_EVIDENCE_FILTERS, APP_VIEWS, resolveAppView,
  parseViewHash, createViewHash, normalizeEvidenceFilters
} from '../shared/viewNavigation.js';

const records = JSON.parse(fs.readFileSync(new URL('../public/data/survey_data.json', import.meta.url))).records;

test('every app section has a bookmarkable URL that restores the same view', () => {
  assert.equal(APP_VIEWS.length, 8);
  for (const view of APP_VIEWS) assert.equal(parseViewHash(createViewHash(view)).view, view);
  assert.deepEqual(parseViewHash(''), { view: 'overview', filters: DEFAULT_EVIDENCE_FILTERS });
});

test('shared survey links round-trip every filter and special search characters', () => {
  const filters = { search: 'RESP-017 & tree + water # मराठी', concern: 'Very Concerned', problem: 'Heat', action: 'Tree Plantation', flood: 'Sometimes' };
  const hash = createViewHash('evidence', filters);
  assert.ok(hash.startsWith('#/evidence?'));
  assert.deepEqual(parseViewHash(hash), { view: 'evidence', filters });
});

test('default filters produce a short link and other views never encode survey search', () => {
  assert.equal(createViewHash('evidence', DEFAULT_EVIDENCE_FILTERS), '#/evidence');
  assert.equal(createViewHash('analytics', { ...DEFAULT_EVIDENCE_FILTERS, search: 'PRIVATE SEARCH' }), '#/analytics');
  assert.deepEqual(parseViewHash('#/analytics?search=PRIVATE'), { view: 'analytics', filters: DEFAULT_EVIDENCE_FILTERS });
});

test('legacy navigation aliases resolve to the existing sections', () => {
  for (const [alias, view] of Object.entries({ 'pdf-explorer': 'evidence', 'sector-impacts': 'impacts', 'risk-engine': 'impacts', roadmap: 'actions' })) {
    assert.equal(resolveAppView(alias), view);
    assert.equal(parseViewHash(`#/${alias}`).view, view);
  }
});

test('unknown routes and malformed values are safe and do not invent sections', () => {
  for (const hash of ['#/does-not-exist?problem=Heat', '#/%E0%A4%A', '#//evidence']) {
    assert.deepEqual(parseViewHash(hash), { view: 'overview', filters: DEFAULT_EVIDENCE_FILTERS });
  }
  assert.doesNotThrow(() => parseViewHash('#/evidence?search=%E0%A4%A'));
  assert.equal(parseViewHash('#/evidence?search=' + 'a'.repeat(500)).filters.search.length, 200);
});

test('links can contain only survey filters, never advisor questions or credentials', () => {
  const filters = { ...DEFAULT_EVIDENCE_FILTERS, problem: 'Heat', question: 'private symptoms', temperatureC: '35', adminKey: 'secret' };
  const hash = createViewHash('evidence', filters);
  assert.equal(hash, '#/evidence?problem=Heat');
  const parsed = parseViewHash('#/evidence?problem=Heat&question=private&temperatureC=35&adminKey=secret');
  assert.deepEqual(parsed.filters, { ...DEFAULT_EVIDENCE_FILTERS, problem: 'Heat' });
});

test('filter values are validated against the actual survey before displaying results', () => {
  assert.deepEqual(normalizeEvidenceFilters({ search: 'RESP-017', concern: 'invalid', problem: 'invalid', action: 'invalid', flood: 'invalid' }, records), {
    ...DEFAULT_EVIDENCE_FILTERS, search: 'RESP-017'
  });
  const valid = { search: '', concern: 'Very Concerned', problem: 'Heat', action: 'Tree Plantation', flood: 'Sometimes' };
  assert.deepEqual(normalizeEvidenceFilters(valid, records), valid);
  assert.equal(normalizeEvidenceFilters({ search: 42, problem: null }).search, '');
  assert.equal(normalizeEvidenceFilters({ search: 'heat' }, []).problem, 'all');
});
