'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSummaryBlocks, buildLogText } = require('../src/utils/format');
const { computeMilestones } = require('../src/utils/timeline');

function blocksToText(blocks) {
  return JSON.stringify(blocks);
}

const fullIntake = {
  restaurant_name: "Mario's Pizzeria",
  legal_business_name: "Mario's Pizzeria LLC",
  business_address: '123 Main St, Austin, TX 78701',
  number_of_locations: '1',
  decision_maker_name: 'Mario Rossi',
  decision_maker_role: 'Owner',
  decision_maker_email: 'mario@example.com',
  decision_maker_phone: '+1 512-555-0100',
  billing_contact: 'billing@example.com',
  close_date: '2026-07-20',
  acv: '$24,000',
  contract_term: '1 year',
  billing_cadence: 'Monthly',
  contract_link: 'https://contracts.example/mario',
  pos_system: 'Toast',
  pos_details: 'single terminal',
  ordering_platforms: 'DoorDash, Uber Eats',
  source_of_truth: 'DoorDash',
  comm_channels: 'Cellphone, WhatsApp',
  phone_plan: 'Dedicated cellphone',
  menu_notes: 'Gluten-free crust as a modifier.',
  csm: 'U01CSM',
  fde: 'U02FDE',
  ai_eng: 'U03AI',
  cc_lead: 'U04CC',
  handoff_notes: 'Prefers texts over calls.',
  sales_rep: 'U00REP',
};

test('buildSummaryBlocks: includes business address and primary contact email', () => {
  const milestones = computeMilestones('2026-08-01');
  const blocks = buildSummaryBlocks(fullIntake, milestones);
  const text = blocksToText(blocks);

  assert.ok(text.includes('123 Main St, Austin, TX 78701'));
  assert.ok(text.includes('mario@example.com'));
  assert.ok(text.includes("Mario's Pizzeria"));
});

test('buildSummaryBlocks: header includes restaurant name', () => {
  const milestones = computeMilestones('2026-08-01');
  const blocks = buildSummaryBlocks(fullIntake, milestones);
  const header = blocks.find((b) => b.type === 'header');

  assert.ok(header);
  assert.ok(header.text.text.includes("Mario's Pizzeria"));
});

test('buildSummaryBlocks: survives a required-only intake without throwing', () => {
  const minimalIntake = {
    restaurant_name: 'Bare Bones Diner',
    business_address: '1 Nowhere Rd',
    decision_maker_name: 'Jane Doe',
    decision_maker_email: 'jane@example.com',
    decision_maker_phone: '555-1234',
    acv: '$1,000',
    contract_term: 'Month-to-month',
  };
  const milestones = computeMilestones(undefined);

  assert.doesNotThrow(() => {
    const blocks = buildSummaryBlocks(minimalIntake, milestones);
    assert.ok(Array.isArray(blocks));
    assert.ok(blocks.length > 0);
  });
});

test('buildSummaryBlocks: unset optional fields render as em dash placeholders', () => {
  const minimalIntake = {
    restaurant_name: 'Bare Bones Diner',
    business_address: '1 Nowhere Rd',
    decision_maker_name: 'Jane Doe',
    decision_maker_email: 'jane@example.com',
    decision_maker_phone: '555-1234',
    acv: '$1,000',
    contract_term: 'Month-to-month',
  };
  const blocks = buildSummaryBlocks(minimalIntake, computeMilestones(undefined));
  const text = blocksToText(blocks);

  assert.ok(text.includes('—')); // —
});

test('buildLogText: includes restaurant name and channel mention', () => {
  const milestones = computeMilestones('2026-08-01');
  const text = buildLogText({ ...fullIntake, goLive: milestones.goLive }, 'C123456');

  assert.ok(text.includes("Mario's Pizzeria"));
  assert.ok(text.includes('<#C123456>'));
  assert.ok(text.includes(milestones.goLive));
});
