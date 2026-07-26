'use strict';

// LIVE demo: unlike scripts/demo.js, this one makes real Asana API calls
// with your ASANA_ACCESS_TOKEN (from .env). It duplicates the real
// "Zappd Onboarding — TEMPLATE" project and adds a real card to the real
// "Zappd — Onboarding Pipeline" board. Uses an obviously-fake restaurant
// name so the result is easy to find and delete/archive afterward — it
// will also show up on the "Zappd Onboarding Pipeline" dashboard until
// you do. Run with: node scripts/asana-sync-demo.js

const config = require('../src/config');
const { computeMilestones } = require('../src/utils/timeline');
const { syncToAsana } = require('../src/asana/sync');

const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const sampleIntake = {
  restaurant_name: `ZTEST Demo Restaurant ${stamp}`,
  legal_business_name: 'ZTEST Demo Restaurant LLC',
  business_address: '123 Demo St, Austin, TX 78701',
  number_of_locations: '1',
  decision_maker_name: 'Demo Owner',
  decision_maker_role: 'Owner',
  decision_maker_email: 'demo-owner@example.test',
  decision_maker_phone: '+1 512-555-0100',
  close_date: '2026-07-20',
  acv: '$24,000',
  contract_term: '1 year',
  billing_cadence: 'Monthly',
  contract_link: 'https://contracts.zappd.example/demo',
  kickoff_date: '2026-08-01',
  pos_system: 'Toast',
  pos_details: 'single terminal',
  ordering_platforms: 'DoorDash, Uber Eats',
  source_of_truth: 'DoorDash',
  comm_channels: 'Cellphone, WhatsApp',
  phone_plan: 'Dedicated cellphone',
  menu_notes: 'This is a demo run from scripts/asana-sync-demo.js.',
  handoff_notes: 'Safe to delete — created by scripts/asana-sync-demo.js.',
};

const consoleLogger = {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
};

async function main() {
  if (!config.ASANA_ACCESS_TOKEN) {
    console.error(
      'ASANA_ACCESS_TOKEN is not set in your .env — add it before running this script ' +
        '(see .env.example).'
    );
    process.exitCode = 1;
    return;
  }

  const milestones = computeMilestones(sampleIntake.kickoff_date);
  const channel = { id: 'C0DEMO12345', name: `cust-ztest-demo-${stamp}` };

  console.log(`Creating a REAL Asana project + Pipeline card named "${sampleIntake.restaurant_name}"...`);
  const result = await syncToAsana({ intake: sampleIntake, milestones, channel, logger: consoleLogger });

  if (result.error) {
    console.error('\nAsana sync failed:', result.error.message);
    process.exitCode = 1;
    return;
  }
  if (result.skipped) {
    console.error('\nSync was skipped (no ASANA_ACCESS_TOKEN) — should not happen given the check above.');
    process.exitCode = 1;
    return;
  }

  console.log('\n=== Success ===');
  console.log('Onboarding project:', result.projectUrl);
  console.log('Pipeline card:', result.pipelineCardUrl);
  console.log('\nOpen both links to sanity-check the content, then delete/archive them when done.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
