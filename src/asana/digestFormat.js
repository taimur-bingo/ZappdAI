'use strict';

const { PHASES } = require('./phases');

// Matches the Pipeline board's own "BLOCKER PROTOCOL": 48h is the point a
// blocker should trigger the "10-min blocker huddle" cadence.
const BLOCKER_AGE_THRESHOLD_HOURS = 48;

function mrkdwn(text) {
  return { type: 'mrkdwn', text };
}

function phaseLabel(status) {
  if (status.isLive) return '✅ *LIVE*';
  if (status.currentPhaseIdx === null) return 'No gate data';
  const phase = PHASES[status.currentPhaseIdx];
  return `G${status.currentPhaseIdx} of 6 (${phase.name})`;
}

function dayLabel(status) {
  return status.dayCount === null
    ? 'Day ?'
    : `Day ${status.dayCount} of ${status.totalTargetDays}`;
}

function hasAgedBlocker(status, thresholdHours) {
  return (status.blockers || []).some((b) => b.hoursAged !== null && b.hoursAged >= thresholdHours);
}

function formatHoursAged(hours) {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = Math.round(hours % 24);
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  return `${Math.round(hours)}h`;
}

/**
 * Build the Block Kit daily onboarding digest: one line per restaurant
 * (gate, day count, an ⚠️ flag if it has a blocker past 48h), sorted so
 * aged-blocker restaurants surface first, followed by a dedicated
 * "blockers past 48h" section if any exist — matching the Pipeline board's
 * own cadence rule that the blocker huddle only happens when the digest
 * shows one. Pure function: no Slack SDK or Asana calls.
 * @param {Array<{name: string, projectUrl: string, currentPhaseIdx: number|null, isLive: boolean, dayCount: number|null, totalTargetDays: number, blockers: Array<{who: string, task: string, hoursAged: number|null}>}>} statuses
 * @param {{now?: Date}} [opts]
 * @returns {object[]} Block Kit blocks
 */
function buildDigestBlocks(statuses, opts = {}) {
  const now = opts.now || new Date();
  const list = statuses || [];
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 Daily Onboarding Standup — ${dateStr}`, emoji: true },
    },
    { type: 'divider' },
  ];

  if (list.length === 0) {
    blocks.push({ type: 'section', text: mrkdwn('No restaurants currently onboarding.') });
    return blocks;
  }

  const sorted = [...list].sort((a, b) => {
    const aAged = hasAgedBlocker(a, BLOCKER_AGE_THRESHOLD_HOURS);
    const bAged = hasAgedBlocker(b, BLOCKER_AGE_THRESHOLD_HOURS);
    if (aAged !== bAged) return aAged ? -1 : 1;
    if (a.isLive !== b.isLive) return a.isLive ? 1 : -1;
    const aIdx = a.currentPhaseIdx === null ? 99 : a.currentPhaseIdx;
    const bIdx = b.currentPhaseIdx === null ? 99 : b.currentPhaseIdx;
    return aIdx - bIdx;
  });

  const lines = sorted.map((s) => {
    const flag = hasAgedBlocker(s, BLOCKER_AGE_THRESHOLD_HOURS) ? ' ⚠️' : '';
    return `• <${s.projectUrl}|*${s.name}*> — ${phaseLabel(s)}, ${dayLabel(s)}${flag}`;
  });
  blocks.push({ type: 'section', text: mrkdwn(lines.join('\n')) });

  const agedBlockers = [];
  sorted.forEach((s) => {
    (s.blockers || []).forEach((b) => {
      if (b.hoursAged !== null && b.hoursAged >= BLOCKER_AGE_THRESHOLD_HOURS) {
        agedBlockers.push({ restaurant: s.name, ...b });
      }
    });
  });

  if (agedBlockers.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'section', text: mrkdwn('🚨 *Blockers past 48h* — huddle time') });
    const blockerLines = agedBlockers.map(
      (b) => `• *${b.restaurant}*: ${b.task} — blocked by *${b.who}* for ${formatHoursAged(b.hoursAged)}`
    );
    blocks.push({ type: 'section', text: mrkdwn(blockerLines.join('\n')) });
  }

  return blocks;
}

module.exports = { buildDigestBlocks, BLOCKER_AGE_THRESHOLD_HOURS, formatHoursAged };
