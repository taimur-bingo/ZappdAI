'use strict';

const { App } = require('@slack/bolt');
const config = require('./src/config');
const slashCommand = require('./src/handlers/slashCommand');
const submission = require('./src/handlers/submission');
const { scheduleDaily } = require('./src/schedule');
const { postDailyDigest } = require('./src/asana/digest');

config.validate();

const app = new App({
  token: config.SLACK_BOT_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET || undefined,
  socketMode: config.SOCKET_MODE,
  appToken: config.SOCKET_MODE ? config.SLACK_APP_TOKEN : undefined,
  port: config.PORT,
});

slashCommand.register(app);
submission.register(app);

(async () => {
  await app.start();
  console.log('⚡️ ZappdAI intake app is running');

  if (config.ASANA_ACCESS_TOKEN && config.STANDUP_CHANNEL) {
    scheduleDaily(config.STANDUP_HOUR, config.STANDUP_MINUTE, () =>
      postDailyDigest(app.client, app.logger)
    );
    console.log(
      `📊 Daily onboarding digest scheduled for ${String(config.STANDUP_HOUR).padStart(2, '0')}:` +
        `${String(config.STANDUP_MINUTE).padStart(2, '0')} → ${config.STANDUP_CHANNEL}`
    );
  }
})();
