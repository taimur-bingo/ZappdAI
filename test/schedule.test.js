'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { msUntilNext } = require('../src/schedule');

test('msUntilNext: returns ms until later today when the target time has not passed', () => {
  const now = new Date(2026, 6, 26, 7, 0, 0); // 7:00 AM local
  const ms = msUntilNext(9, 0, now);

  assert.equal(ms, 2 * 60 * 60 * 1000); // 2 hours
});

test('msUntilNext: rolls over to tomorrow when the target time already passed today', () => {
  const now = new Date(2026, 6, 26, 10, 0, 0); // 10:00 AM local
  const ms = msUntilNext(9, 0, now);

  assert.equal(ms, 23 * 60 * 60 * 1000); // 23 hours until 9am tomorrow
});

test('msUntilNext: rolls over to tomorrow when now is exactly the target time', () => {
  const now = new Date(2026, 6, 26, 9, 0, 0, 0);
  const ms = msUntilNext(9, 0, now);

  assert.equal(ms, 24 * 60 * 60 * 1000);
});

test('msUntilNext: handles month boundaries correctly', () => {
  const now = new Date(2026, 6, 31, 10, 0, 0); // July 31, 10am, target already passed
  const ms = msUntilNext(9, 0, now);
  const expected = new Date(2026, 7, 1, 9, 0, 0).getTime() - now.getTime(); // Aug 1, 9am

  assert.equal(ms, expected);
});
