'use strict';

const config = require('../config');
const { fetchOnboardingStatuses } = require('./status');
const { buildDigestBlocks } = require('./digestFormat');

/**
 * Fetch every restaurant's onboarding status from Asana and post the daily
 * digest to config.STANDUP_CHANNEL. Best-effort: no-ops if Asana or the
 * standup channel aren't configured, and never throws — callers (the daily
 * scheduler, or a manual demo script) get a result object back instead.
 * @param {import('@slack/web-api').WebClient} client
 * @param {{info: Function, warn: Function, error: Function}} [logger]
 * @returns {Promise<{posted: true, count: number}|{skipped: true}|{error: Error}>}
 */
async function postDailyDigest(client, logger) {
  const log = logger || console;

  if (!config.ASANA_ACCESS_TOKEN) {
    log.info('ASANA_ACCESS_TOKEN not set; skipping daily digest.');
    return { skipped: true };
  }
  if (!config.STANDUP_CHANNEL) {
    log.info('STANDUP_CHANNEL not set; skipping daily digest.');
    return { skipped: true };
  }

  try {
    const statuses = await fetchOnboardingStatuses();
    const blocks = buildDigestBlocks(statuses);

    await client.chat.postMessage({
      channel: config.STANDUP_CHANNEL,
      text: 'Daily Onboarding Standup',
      blocks,
    });

    return { posted: true, count: statuses.length };
  } catch (err) {
    log.error('Daily digest failed', err);
    return { error: err };
  }
}

module.exports = { postDailyDigest };
