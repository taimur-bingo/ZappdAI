'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildProjectNotes, buildPipelineCardNotes } = require('../src/asana/format');
const { computeMilestones } = require('../src/utils/timeline');

const fullIntake = {
  restaurant_name: "Mario's Pizzeria",
  legal_business_name: "Mario's Pizzeria LLC",
  business_address: '123 Main St, Austin, TX 78701',
  number_of_locations: '1',
  decision_maker_name: 'Mario Rossi',
  decision_maker_role: 'Owner',
  decision_maker_email: 'mario@example.com',
  decision_maker_phone: '+1 512-555-0100',
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
  handoff_notes: 'Prefers texts over calls.',
};

test('buildProjectNotes: includes business address, contact email, and channel', () => {
  const milestones = computeMilestones('2026-08-01');
  const notes = buildProjectNotes(fullIntake, milestones, { channelName: 'cust-marios-pizzeria' });

  assert.ok(notes.includes('123 Main St, Austin, TX 78701'));
  assert.ok(notes.includes('mario@example.com'));
  assert.ok(notes.includes('#cust-marios-pizzeria'));
  assert.ok(notes.includes(milestones.kickoff));
});

test('buildProjectNotes: survives a minimal intake without throwing', () => {
  const minimalIntake = {
    restaurant_name: 'Bare Bones Diner',
    business_address: '1 Nowhere Rd',
    decision_maker_name: 'Jane Doe',
    decision_maker_email: 'jane@example.com',
    decision_maker_phone: '555-1234',
    acv: '$1,000',
    contract_term: 'Month-to-month',
  };

  assert.doesNotThrow(() => {
    const notes = buildProjectNotes(minimalIntake, computeMilestones(undefined), {});
    assert.ok(notes.includes('—'));
  });
});

test('buildProjectNotes: handles missing links gracefully', () => {
  assert.doesNotThrow(() => {
    const notes = buildProjectNotes(fullIntake, computeMilestones('2026-08-01'), undefined);
    assert.ok(notes.includes('#—'));
  });
});

test('buildPipelineCardNotes: includes decision-maker and project link', () => {
  const notes = buildPipelineCardNotes(fullIntake, {
    projectUrl: 'https://app.asana.com/1/1216867179823321/project/999',
    channelName: 'cust-marios-pizzeria',
  });

  assert.ok(notes.includes('Mario Rossi'));
  assert.ok(notes.includes('mario@example.com'));
  assert.ok(notes.includes('https://app.asana.com/1/1216867179823321/project/999'));
  assert.ok(notes.includes('#cust-marios-pizzeria'));
});

test('buildPipelineCardNotes: survives missing intake/links without throwing', () => {
  assert.doesNotThrow(() => {
    const notes = buildPipelineCardNotes(undefined, undefined);
    assert.ok(notes.includes('—'));
  });
});
