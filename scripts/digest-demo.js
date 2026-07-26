'use strict';

// LIVE demo: posts a REAL digest message to your configured STANDUP_CHANNEL,
// pulling real data from Asana. Useful to test without waiting for the
// scheduled time. Run with: node scripts/digest-demo.js
//
// Note: the bot must already be a member of STANDUP_CHANNEL (and that
// channel must exist) for the post to succeed — same requirement as any
// other chat.postMessage call. Create #onboarding-standup and invite the
// bot first if you haven't already.

const { WebClient } = require('@slack/web-api');
const config = require('../src/config');
const { postDailyDigest } = require('../src/asana/digest');

async function main() {
  if (!config.SLACK_BOT_TOKEN) {
    console.error('SLACK_BOT_TOKEN is not set in your .env.');
    process.exitCode = 1;
    return;
  }
  if (!config.ASANA_ACCESS_TOKEN) {
    console.error('ASANA_ACCESS_TOKEN is not set in your .env.');
    process.exitCode = 1;
    return;
  }
  if (!config.STANDUP_CHANNEL) {
    console.error('STANDUP_CHANNEL is not set in your .env (it disables the digest when empty).');
    process.exitCode = 1;
    return;
  }

  const client = new WebClient(config.SLACK_BOT_TOKEN);
  console.log(`Posting a real digest to ${config.STANDUP_CHANNEL}...`);

  const result = await postDailyDigest(client, console);

  if (result.error) {
    console.error('\nDigest failed:', result.error.message);
    process.exitCode = 1;
    return;
  }
  if (result.skipped) {
    console.error('\nSkipped — should not happen given the checks above.');
    process.exitCode = 1;
    return;
  }

  console.log(`\nPosted a digest covering ${result.count} restaurant(s) to ${config.STANDUP_CHANNEL}.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exitCode = 1;
});
