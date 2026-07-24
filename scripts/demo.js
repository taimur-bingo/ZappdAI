'use strict';

// Offline demo: no Slack connection. Exercises the pure utils end-to-end
// against a realistic sample intake so you can eyeball the generated
// channel name, milestones, and Block Kit payloads.

const { channelName } = require('../src/utils/slug');
const { computeMilestones } = require('../src/utils/timeline');
const { buildSummaryBlocks, buildLogText } = require('../src/utils/format');
const { buildOnboardingBlocks } = require('../src/onboarding');

const sampleIntake = {
  restaurant_name: "Mario's Pizzeria",
  legal_business_name: "Mario's Pizzeria LLC",
  business_address: '123 Main St, Austin, TX 78701',
  location: 'Austin, TX',
  number_of_locations: '1',
  decision_maker_name: 'Mario Rossi',
  decision_maker_role: 'Owner',
  decision_maker_email: 'mario@mariospizzeria.example',
  decision_maker_phone: '+1 512-555-0100',
  billing_contact: 'billing@mariospizzeria.example',

  close_date: '2026-07-20',
  acv: '$24,000',
  contract_term: '1 year',
  billing_cadence: 'Monthly',
  contract_link: 'https://contracts.zappd.example/mario-2026',

  kickoff_date: '2026-08-01',
  pos_system: 'Toast',
  pos_details: 'Toast POS, single terminal',
  ordering_platforms: 'DoorDash, Uber Eats',
  source_of_truth: 'DoorDash',
  comm_channels: 'Cellphone, WhatsApp',
  phone_plan: 'Dedicated cellphone',
  menu_notes: 'Owner wants gluten-free crust listed as a modifier, not a separate item.',

  csm: 'U01CSMLEAD',
  fde: 'U02FDELEAD',
  ai_eng: 'U03AIENG',
  cc_lead: 'U04CCLEAD',
  handoff_notes: 'Owner is hands-on and responsive; prefers texts over calls.',

  sales_rep: 'U00SALESREP',
};

function main() {
  const name = channelName(sampleIntake.restaurant_name, 'cust-');
  const milestones = computeMilestones(sampleIntake.kickoff_date);
  const summaryBlocks = buildSummaryBlocks(sampleIntake, milestones);
  const onboardingBlocks = buildOnboardingBlocks(sampleIntake, milestones);
  const logText = buildLogText({ ...sampleIntake, goLive: milestones.goLive }, 'C0DEMO12345');

  console.log('=== Channel name ===');
  console.log(name);

  console.log('\n=== Milestones ===');
  console.log(JSON.stringify(milestones, null, 2));

  console.log('\n=== Summary blocks ===');
  console.log(JSON.stringify(summaryBlocks, null, 2));

  console.log('\n=== Onboarding blocks ===');
  console.log(JSON.stringify(onboardingBlocks, null, 2));

  console.log('\n=== Log text ===');
  console.log(logText);
}

main();
