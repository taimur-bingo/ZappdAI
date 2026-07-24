'use strict';

const { App } = require('@slack/bolt');
const config = require('./src/config');
const slashCommand = require('./src/handlers/slashCommand');
const submission = require('./src/handlers/submission');

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
})();
