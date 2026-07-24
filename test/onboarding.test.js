'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PHASES, buildOnboardingBlocks } = require('../src/onboarding');
const { computeMilestones } = require('../src/utils/timeline');

test('PHASES has exactly 6 entries', () => {
  assert.equal(PHASES.length, 6);
});

test('PHASES: every phase has title, goal, dayRange, and 3+ tasks with task/owner/day', () => {
  for (const phase of PHASES) {
    assert.equal(typeof phase.title, 'string');
    assert.equal(typeof phase.goal, 'string');
    assert.equal(typeof phase.dayRange, 'string');
    assert.ok(Array.isArray(phase.tasks));
    assert.ok(phase.tasks.length >= 3);
    for (const task of phase.tasks) {
      assert.equal(typeof task.task, 'string');
      assert.equal(typeof task.owner, 'string');
      assert.equal(typeof task.day, 'number');
    }
  }
});

test('PHASES includes a Menu Centralization critical-path phase', () => {
  const menuPhase = PHASES.find((p) => /menu centralization/i.test(p.title));
  assert.ok(menuPhase);
  assert.match(menuPhase.title, /critical path/i);
});

test('buildOnboardingBlocks: returns a non-empty Block Kit array', () => {
  const milestones = computeMilestones('2026-08-01');
  const blocks = buildOnboardingBlocks({ restaurant_name: "Mario's Pizzeria" }, milestones);

  assert.ok(Array.isArray(blocks));
  assert.ok(blocks.length > 0);
});

test('buildOnboardingBlocks: includes a Menu Centralization phase in the rendered text', () => {
  const milestones = computeMilestones('2026-08-01');
  const blocks = buildOnboardingBlocks({ restaurant_name: "Mario's Pizzeria" }, milestones);
  const text = JSON.stringify(blocks);

  assert.match(text, /Menu Centralization/i);
});

test('buildOnboardingBlocks: does not throw with null milestones', () => {
  assert.doesNotThrow(() => buildOnboardingBlocks({}, { kickoff: null }));
});
