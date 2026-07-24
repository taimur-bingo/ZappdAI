'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { addDays, computeMilestones } = require('../src/utils/timeline');

test('addDays: adds days UTC-safe, YYYY-MM-DD in/out', () => {
  assert.equal(addDays('2026-08-01', 7), '2026-08-08');
  assert.equal(addDays('2026-08-01', 10), '2026-08-11');
});

test('addDays: rolls over month/year boundaries', () => {
  assert.equal(addDays('2026-12-28', 5), '2027-01-02');
});

test('addDays: returns null for invalid input instead of throwing', () => {
  assert.equal(addDays('not-a-date', 5), null);
  assert.equal(addDays(null, 5), null);
  assert.equal(addDays('2026-02-31', 1), null);
});

test('computeMilestones: default offsets from kickoff', () => {
  const result = computeMilestones('2026-08-01');
  assert.deepEqual(result, {
    kickoff: '2026-08-01',
    nomenclatureSignOff: '2026-08-08',
    goLive: '2026-08-11',
  });
});

test('computeMilestones: invalid kickoff yields all nulls, no throw', () => {
  const result = computeMilestones('garbage');
  assert.deepEqual(result, { kickoff: null, nomenclatureSignOff: null, goLive: null });
});

test('computeMilestones: undefined kickoff yields all nulls, no throw', () => {
  assert.doesNotThrow(() => computeMilestones(undefined));
  const result = computeMilestones(undefined);
  assert.deepEqual(result, { kickoff: null, nomenclatureSignOff: null, goLive: null });
});

test('computeMilestones: override signoffDay/goLiveDay', () => {
  const result = computeMilestones('2026-08-01', { signoffDay: 3, goLiveDay: 5 });
  assert.deepEqual(result, {
    kickoff: '2026-08-01',
    nomenclatureSignOff: '2026-08-04',
    goLive: '2026-08-06',
  });
});
