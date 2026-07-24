'use strict';

const { buildIntakeModalView } = require('../intakeForm');

/**
 * Register the /intake slash command: ack immediately, then open the
 * intake modal.
 * @param {import('@slack/bolt').App} app
 */
function register(app) {
  app.command('/intake', async ({ ack, body, client, logger }) => {
    await ack();

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: buildIntakeModalView(),
      });
    } catch (err) {
      logger.error('Failed to open /intake modal', err);
    }
  });
}

module.exports = { register };
