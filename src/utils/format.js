'use strict';

const EMPTY = '—';

function val(v) {
  if (Array.isArray(v)) return v.length ? v.join(', ') : EMPTY;
  if (v === null || v === undefined || v === '') return EMPTY;
  return String(v);
}

function mention(userId) {
  return userId ? `<@${userId}>` : EMPTY;
}

function mrkdwn(text) {
  return { type: 'mrkdwn', text };
}

function fieldsSection(title, fields) {
  return {
    type: 'section',
    text: mrkdwn(`*${title}*`),
    fields: fields.map(([label, value]) => mrkdwn(`*${label}:*\n${value}`)),
  };
}

function textSection(title, body) {
  return {
    type: 'section',
    text: mrkdwn(`*${title}*\n${body}`),
  };
}

const divider = { type: 'divider' };

/**
 * Build the Block Kit summary that gets posted + pinned to a new customer
 * onboarding channel. Pure function: no Slack SDK or env access.
 * @param {object} intake - extracted intake modal fields
 * @param {{kickoff: string|null, nomenclatureSignOff: string|null, goLive: string|null}} milestones
 * @returns {object[]} Block Kit blocks
 */
function buildSummaryBlocks(intake, milestones) {
  const i = intake || {};
  const m = milestones || {};

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🍽️ New Zappd Customer: ${val(i.restaurant_name)}`, emoji: true },
    },
    divider,
    fieldsSection('Business', [
      ['Legal business name', val(i.legal_business_name)],
      ['Address', val(i.business_address)],
      ['# Locations', val(i.number_of_locations)],
    ]),
    fieldsSection('Primary contact', [
      ['Name', val(i.decision_maker_name)],
      ['Role', val(i.decision_maker_role)],
      ['Email', val(i.decision_maker_email)],
      ['Phone', val(i.decision_maker_phone)],
    ]),
    fieldsSection('Billing', [['Billing contact', val(i.billing_contact)]]),
    fieldsSection('Contract', [
      ['ACV', val(i.acv)],
      ['Term', val(i.contract_term)],
      ['Billing cadence', val(i.billing_cadence)],
      ['Signed date', val(i.close_date)],
      ['Contract link', val(i.contract_link)],
    ]),
    divider,
    fieldsSection('Timeline', [
      ['Kickoff (D0)', val(m.kickoff)],
      ['Menu sign-off (~D7)', val(m.nomenclatureSignOff)],
      ['Go-live (~D10)', val(m.goLive)],
    ]),
    divider,
    fieldsSection('Stack', [
      ['POS', i.pos_system ? `${val(i.pos_system)}${i.pos_details ? ` (${i.pos_details})` : ''}` : EMPTY],
      ['Ordering platforms', val(i.ordering_platforms)],
      ['Source of truth', val(i.source_of_truth)],
      ['Comm channels', val(i.comm_channels)],
      ['Phone plan', val(i.phone_plan)],
    ]),
    divider,
    fieldsSection('Team', [
      ['CSM', mention(i.csm)],
      ['FDE', mention(i.fde)],
      ['AI/Engineering', mention(i.ai_eng)],
      ['Command Center Lead', mention(i.cc_lead)],
    ]),
    divider,
    textSection('Menu notes', val(i.menu_notes)),
    textSection('Handoff notes', val(i.handoff_notes)),
    textSection('Sales rep', mention(i.sales_rep)),
  ];

  return blocks;
}

/**
 * Short mrkdwn summary posted to the internal handoff log channel. Expects
 * the caller to have merged the computed go-live date onto intake as
 * `goLive` (submission.js does this before calling).
 * @param {object} intake
 * @param {string} channelId
 * @returns {string}
 */
function buildLogText(intake, channelId) {
  const i = intake || {};
  return (
    `🍽️ *${val(i.restaurant_name)}* — new onboarding channel <#${channelId}>. ` +
    `Go-live target: ${val(i.goLive)}`
  );
}

module.exports = { buildSummaryBlocks, buildLogText };
