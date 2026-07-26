'use strict';

require('dotenv').config();

function toBool(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function toInt(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? defaultValue : n;
}

const config = Object.freeze({
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN || '',
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',

  SOCKET_MODE: toBool(process.env.SOCKET_MODE, true),
  PORT: toInt(process.env.PORT, 3000),

  HANDOFF_LEAD_EMAIL: process.env.HANDOFF_LEAD_EMAIL || 'khantaimur@icloud.com',
  HANDOFF_LEAD_USER_ID: process.env.HANDOFF_LEAD_USER_ID || '',
  HANDOFF_LOG_CHANNEL: process.env.HANDOFF_LOG_CHANNEL || '',

  CHANNEL_PREFIX: process.env.CHANNEL_PREFIX || 'cust-',
  CHANNEL_VISIBILITY: process.env.CHANNEL_VISIBILITY || 'private',

  SIGNOFF_DAY: toInt(process.env.SIGNOFF_DAY, 7),
  GOLIVE_DAY: toInt(process.env.GOLIVE_DAY, 10),

  // Optional: enables auto-creating the Asana onboarding project + Pipeline
  // board card on every intake submission. Left unset, that step no-ops
  // and the rest of the app behaves exactly as it does today.
  ASANA_ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN || '',

  /**
   * Throws with a clear message if required credentials for the selected
   * connection mode are missing. Call this once at app startup.
   */
  validate() {
    const missing = [];

    if (!this.SLACK_BOT_TOKEN) missing.push('SLACK_BOT_TOKEN');

    if (this.SOCKET_MODE) {
      if (!this.SLACK_APP_TOKEN) missing.push('SLACK_APP_TOKEN');
    } else {
      if (!this.SLACK_SIGNING_SECRET) missing.push('SLACK_SIGNING_SECRET');
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variable(s): ${missing.join(', ')}. ` +
          'See .env.example for the full list.'
      );
    }
  },
});

module.exports = config;
