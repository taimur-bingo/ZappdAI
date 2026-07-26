'use strict';

const { val, EMPTY } = require('../utils/format');

/**
 * Plain-text notes written to a newly duplicated onboarding project. Same
 * source fields as src/utils/format.js's buildSummaryBlocks, rendered as
 * plain text (Asana project notes don't support Block Kit or Slack mrkdwn).
 * Pure function: no Asana SDK or env access.
 * @param {object} intake - extracted intake modal fields
 * @param {{kickoff: string|null, nomenclatureSignOff: string|null, goLive: string|null}} milestones
 * @param {{channelName?: string}} links
 * @returns {string}
 */
function buildProjectNotes(intake, milestones, links) {
  const i = intake || {};
  const m = milestones || {};
  const l = links || {};

  const posLine = i.pos_system
    ? `${val(i.pos_system)}${i.pos_details ? ` (${i.pos_details})` : ''}`
    : EMPTY;

  const lines = [
    `Auto-created from the #${l.channelName || EMPTY} Slack intake channel.`,
    '',
    'BUSINESS',
    `Legal business name: ${val(i.legal_business_name)}`,
    `Address: ${val(i.business_address)}`,
    `# Locations: ${val(i.number_of_locations)}`,
    '',
    'PRIMARY CONTACT',
    `Name: ${val(i.decision_maker_name)}`,
    `Role: ${val(i.decision_maker_role)}`,
    `Email: ${val(i.decision_maker_email)}`,
    `Phone: ${val(i.decision_maker_phone)}`,
    '',
    'CONTRACT',
    `ACV: ${val(i.acv)}`,
    `Term: ${val(i.contract_term)}`,
    `Billing cadence: ${val(i.billing_cadence)}`,
    `Signed date: ${val(i.close_date)}`,
    `Contract link: ${val(i.contract_link)}`,
    '',
    'TIMELINE',
    `Kickoff (D0): ${val(m.kickoff)}`,
    `Menu sign-off target: ${val(m.nomenclatureSignOff)}`,
    `Go-live target: ${val(m.goLive)}`,
    '',
    'STACK',
    `POS: ${posLine}`,
    `Ordering platforms: ${val(i.ordering_platforms)}`,
    `Source of truth: ${val(i.source_of_truth)}`,
    `Comm channels: ${val(i.comm_channels)}`,
    `Phone plan: ${val(i.phone_plan)}`,
    '',
    'NOTES',
    `Menu notes: ${val(i.menu_notes)}`,
    `Handoff notes: ${val(i.handoff_notes)}`,
    '',
    `Slack channel: #${l.channelName || EMPTY}`,
  ];

  return lines.join('\n');
}

/**
 * Plain-text notes for the new card on the "Zappd — Onboarding Pipeline"
 * wall-chart board. Pure function: no Asana SDK or env access.
 * @param {object} intake
 * @param {{projectUrl?: string, channelName?: string}} links
 * @returns {string}
 */
function buildPipelineCardNotes(intake, links) {
  const i = intake || {};
  const l = links || {};

  const lines = [
    `Decision-maker: ${val(i.decision_maker_name)} (${val(i.decision_maker_email)}, ${val(
      i.decision_maker_phone
    )})`,
    `POS: ${val(i.pos_system)}`,
    `Source of truth: ${val(i.source_of_truth)}`,
    '',
    `Onboarding project: ${val(l.projectUrl)}`,
    `Slack channel: #${l.channelName || EMPTY}`,
  ];

  return lines.join('\n');
}

module.exports = { buildProjectNotes, buildPipelineCardNotes };
