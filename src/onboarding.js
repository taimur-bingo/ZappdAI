'use strict';

const { addDays } = require('./utils/timeline');

const ROLES = Object.freeze({
  CSM: 'CSM',
  FDE: 'FDE',
  AI_ENG: 'AI/Engineering',
  CC_LEAD: 'Command Center Lead',
});

/**
 * The ~10-day onboarding plan, compressed into 6 phases. Pure data + a
 * pure block-builder below: no Slack SDK or env access, so this module is
 * safe to unit test with zero installed dependencies.
 */
const PHASES = Object.freeze([
  {
    title: 'Phase 0: Kickoff & Discovery',
    goal: 'Align internally on the handoff and confirm what we know before touching anything customer-facing.',
    dayRange: 'Day 1',
    tasks: [
      { task: 'Internal kickoff sync — review intake & handoff notes', owner: ROLES.CSM, day: 1 },
      { task: 'Confirm decision-maker contact, comm channels, and POS access owner', owner: ROLES.FDE, day: 1 },
      { task: 'Align on success criteria and target go-live date', owner: ROLES.CSM, day: 1 },
    ],
  },
  {
    title: 'Phase 1: Comm Channel Provisioning',
    goal: 'Stand up whatever phone/SMS/chat channel the restaurant will use to receive Zappd orders.',
    dayRange: 'Days 1–3',
    tasks: [
      { task: 'Provision comm channel per phone plan (dedicated line, shared cell, SMS-enable landline, etc.)', owner: ROLES.FDE, day: 1 },
      { task: 'Test inbound/outbound messaging on the new channel', owner: ROLES.FDE, day: 2 },
      { task: 'Confirm owner sign-off on comm channel setup', owner: ROLES.CSM, day: 3 },
    ],
  },
  {
    title: 'Phase 2: Menu Centralization (CRITICAL PATH)',
    goal: 'Produce a single canonical menu spec that reconciles POS data with every ordering platform.',
    dayRange: 'Days 1–7',
    tasks: [
      { task: 'Confirm source-of-truth platform for the menu', owner: ROLES.CSM, day: 2 },
      { task: 'Obtain POS access and pull POS + source-platform menus', owner: ROLES.FDE, day: 4 },
      { task: 'Build side-by-side menu comparison', owner: ROLES.FDE, day: 5 },
      { task: 'Resolve naming/pricing conflicts with the owner', owner: `${ROLES.CSM} + ${ROLES.FDE}`, day: 6 },
      { task: 'Document canonical menu spec and update POS', owner: ROLES.FDE, day: 7 },
    ],
  },
  {
    title: 'Phase 3: Zappd Platform Provisioning',
    goal: 'Load the canonical menu into Zappd and prove an order can flow end-to-end.',
    dayRange: 'Days 6–8',
    tasks: [
      { task: 'Apply canonical menu to Zappd ordering logic', owner: ROLES.AI_ENG, day: 8 },
      { task: 'Wire up text gateway + POS integration and run a test order', owner: ROLES.AI_ENG, day: 8 },
      { task: 'Command Center onboarding for the restaurant', owner: ROLES.CC_LEAD, day: 8 },
    ],
  },
  {
    title: 'Phase 4: Owner Review & Revisions',
    goal: 'Get the owner to sign off on exactly what will go live.',
    dayRange: 'Days 8–9',
    tasks: [
      { task: 'Menu walkthrough with owner', owner: ROLES.CSM, day: 8 },
      { task: 'Apply requested changes and re-test', owner: ROLES.AI_ENG, day: 9 },
      { task: 'Final owner approval', owner: ROLES.CSM, day: 9 },
    ],
  },
  {
    title: 'Phase 5: Go-Live & Handoff',
    goal: 'Flip the switch, run the first live order, and hand off to ongoing support.',
    dayRange: 'Days 9–10',
    tasks: [
      { task: 'Deliver credentials to restaurant', owner: ROLES.CSM, day: 9 },
      { task: 'First live order via Command Center', owner: ROLES.CC_LEAD, day: 10 },
      { task: 'Hand off to ongoing support and record completion', owner: ROLES.CSM, day: 10 },
    ],
  },
]);

function mrkdwn(text) {
  return { type: 'mrkdwn', text };
}

function taskLine(task, kickoff) {
  const abs = kickoff ? addDays(kickoff, task.day - 1) : null;
  const dateSuffix = abs ? `, ${abs}` : '';
  return `• *${task.task}* — ${task.owner} (Day ${task.day}${dateSuffix})`;
}

/**
 * Build the Block Kit onboarding plan posted + pinned alongside the intake
 * summary. `intake` is accepted for future customization hooks (e.g.
 * restaurant name in the header) but the plan itself is not intake-driven.
 * @param {object} intake
 * @param {{kickoff: string|null}} milestones
 * @returns {object[]} Block Kit blocks
 */
function buildOnboardingBlocks(intake, milestones) {
  const i = intake || {};
  const kickoff = milestones && milestones.kickoff ? milestones.kickoff : null;
  const restaurantName = i.restaurant_name ? ` for ${i.restaurant_name}` : '';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🗓️ Onboarding Plan${restaurantName} (~10 days)`, emoji: true },
    },
    { type: 'divider' },
  ];

  PHASES.forEach((phase) => {
    blocks.push({
      type: 'section',
      text: mrkdwn(`*${phase.title}* _(${phase.dayRange})_\n${phase.goal}`),
    });
    blocks.push({
      type: 'section',
      text: mrkdwn(phase.tasks.map((t) => taskLine(t, kickoff)).join('\n')),
    });
    blocks.push({ type: 'divider' });
  });

  return blocks;
}

module.exports = { PHASES, ROLES, buildOnboardingBlocks };
