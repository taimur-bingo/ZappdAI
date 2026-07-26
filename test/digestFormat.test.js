'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDigestBlocks, formatHoursAged } = require('../src/asana/digestFormat');

const NOW = new Date('2026-08-10T12:00:00.000Z');

function blocksToText(blocks) {
  return JSON.stringify(blocks);
}

test('buildDigestBlocks: renders a header with the date', () => {
  const blocks = buildDigestBlocks([], { now: NOW });
  const header = blocks.find((b) => b.type === 'header');

  assert.ok(header);
  assert.ok(header.text.text.includes('Daily Onboarding Standup'));
  assert.ok(header.text.text.includes('August 10'));
});

test('buildDigestBlocks: handles zero restaurants without throwing', () => {
  assert.doesNotThrow(() => {
    const blocks = buildDigestBlocks([], { now: NOW });
    assert.ok(blocksToText(blocks).includes('No restaurants currently onboarding'));
  });
});

test('buildDigestBlocks: includes gate and day count for an active restaurant', () => {
  const statuses = [
    {
      name: "Mario's Pizzeria",
      projectUrl: 'https://app.asana.com/1/1/project/999/list',
      currentPhaseIdx: 2,
      isLive: false,
      dayCount: 9,
      totalTargetDays: 20,
      blockers: [],
    },
  ];
  const text = blocksToText(buildDigestBlocks(statuses, { now: NOW }));

  assert.ok(text.includes("Mario's Pizzeria"));
  assert.ok(text.includes('G2 of 6'));
  assert.ok(text.includes('Day 9 of 20'));
});

test('buildDigestBlocks: marks LIVE restaurants distinctly', () => {
  const statuses = [
    {
      name: 'Live Diner',
      projectUrl: 'https://app.asana.com/1/1/project/1/list',
      currentPhaseIdx: 5,
      isLive: true,
      dayCount: 20,
      totalTargetDays: 20,
      blockers: [],
    },
  ];
  const text = blocksToText(buildDigestBlocks(statuses, { now: NOW }));

  assert.ok(text.includes('LIVE'));
});

test('buildDigestBlocks: flags a blocker aged past 48h and adds the huddle section', () => {
  const statuses = [
    {
      name: 'Stalled Spot',
      projectUrl: 'https://app.asana.com/1/1/project/2/list',
      currentPhaseIdx: 2,
      isLive: false,
      dayCount: 7,
      totalTargetDays: 20,
      blockers: [{ who: 'Restaurant', task: 'Confirm source-of-truth platform', hoursAged: 72 }],
    },
  ];
  const text = blocksToText(buildDigestBlocks(statuses, { now: NOW }));

  assert.ok(text.includes('⚠️'));
  assert.ok(text.includes('Blockers past 48h'));
  assert.ok(text.includes('Confirm source-of-truth platform'));
  assert.ok(text.includes('blocked by *Restaurant*'));
});

test('buildDigestBlocks: does not add the huddle section for blockers under 48h', () => {
  const statuses = [
    {
      name: 'Freshly Blocked',
      projectUrl: 'https://app.asana.com/1/1/project/3/list',
      currentPhaseIdx: 1,
      isLive: false,
      dayCount: 3,
      totalTargetDays: 20,
      blockers: [{ who: 'Vendor', task: 'Landline SMS-enablement', hoursAged: 5 }],
    },
  ];
  const text = blocksToText(buildDigestBlocks(statuses, { now: NOW }));

  assert.ok(!text.includes('Blockers past 48h'));
});

test('buildDigestBlocks: sorts aged-blocker restaurants first', () => {
  const statuses = [
    {
      name: 'Clean Run',
      projectUrl: 'u1',
      currentPhaseIdx: 0,
      isLive: false,
      dayCount: 1,
      totalTargetDays: 20,
      blockers: [],
    },
    {
      name: 'Aged Blocker',
      projectUrl: 'u2',
      currentPhaseIdx: 3,
      isLive: false,
      dayCount: 15,
      totalTargetDays: 20,
      blockers: [{ who: 'Us', task: 'Something stuck', hoursAged: 96 }],
    },
  ];
  const blocks = buildDigestBlocks(statuses, { now: NOW });
  const listSection = blocks.find((b) => b.text && b.text.text && b.text.text.includes('Clean Run'));

  assert.ok(listSection.text.text.indexOf('Aged Blocker') < listSection.text.text.indexOf('Clean Run'));
});

test('buildDigestBlocks: handles a restaurant with no Kickoff Date set', () => {
  const statuses = [
    {
      name: 'No Kickoff Yet',
      projectUrl: 'u1',
      currentPhaseIdx: 0,
      isLive: false,
      dayCount: null,
      totalTargetDays: 20,
      blockers: [],
    },
  ];
  assert.doesNotThrow(() => {
    const text = blocksToText(buildDigestBlocks(statuses, { now: NOW }));
    assert.ok(text.includes('Day ?'));
  });
});

test('formatHoursAged: renders under-a-day durations in hours, multi-day in days+hours', () => {
  assert.equal(formatHoursAged(5), '5h');
  assert.equal(formatHoursAged(48), '2d');
  assert.equal(formatHoursAged(53), '2d 5h');
});
