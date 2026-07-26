'use strict';

const config = require('../config');
const { channelName } = require('../utils/slug');
const { computeMilestones } = require('../utils/timeline');
const { buildSummaryBlocks, buildLogText } = require('../utils/format');
const { buildOnboardingBlocks } = require('../onboarding');
const { createHandoffChannel, resolveLeadUserId, inviteUsers } = require('../slack/channel');
const { CALLBACK_ID } = require('../intakeForm');
const { syncToAsana } = require('../asana/sync');

const REQUIRED_FIELDS = {
  restaurant_name: 'Restaurant name is required.',
  business_address: 'Business address is required.',
  decision_maker_email: 'Decision maker email is required.',
  decision_maker_phone: 'Decision maker phone is required.',
  acv: 'ACV is required.',
  contract_term: 'Contract term is required.',
};

/**
 * Flatten a Slack view.state.values object into { block_id: value } using
 * the element type to decide how to read the value.
 * @param {object} view - Slack view submission payload
 * @returns {object}
 */
function extractIntakeFields(view) {
  const values = (view && view.state && view.state.values) || {};
  const intake = {};

  for (const blockId of Object.keys(values)) {
    const actions = values[blockId];
    const actionId = Object.keys(actions)[0];
    const action = actions[actionId] || {};

    if (Array.isArray(action.selected_options)) {
      intake[blockId] = action.selected_options.map((o) => o.value).join(', ');
    } else if (action.selected_option) {
      intake[blockId] = action.selected_option.value;
    } else if (action.selected_date !== undefined) {
      intake[blockId] = action.selected_date || null;
    } else if (action.selected_user !== undefined) {
      intake[blockId] = action.selected_user || null;
    } else if (action.value !== undefined) {
      intake[blockId] = action.value || null;
    }
  }

  return intake;
}

function validateIntake(intake) {
  const errors = {};
  for (const [field, message] of Object.entries(REQUIRED_FIELDS)) {
    if (!intake[field]) errors[field] = message;
  }
  return errors;
}

async function dmUser(client, userId, text, blocks) {
  if (!userId) return;
  try {
    await client.chat.postMessage({ channel: userId, text, ...(blocks ? { blocks } : {}) });
  } catch (err) {
    // Best-effort DM; nothing else we can do if this fails.
  }
}

/**
 * Create the customer channel, retrying once with a short suffix if the
 * name is already taken.
 */
async function createChannelWithRetry(client, baseName, isPrivate) {
  try {
    return await createHandoffChannel(client, { name: baseName, isPrivate });
  } catch (err) {
    const slackError = err && err.data && err.data.error;
    if (slackError !== 'name_taken') throw err;

    const suffix = Math.random().toString(36).slice(2, 6);
    const retryName = `${baseName}-${suffix}`.slice(0, 80);
    return await createHandoffChannel(client, { name: retryName, isPrivate });
  }
}

/**
 * Register the intake_submit view handler: validate, create the channel,
 * invite the handoff lead + team, and post/pin the summary + onboarding
 * plan.
 * @param {import('@slack/bolt').App} app
 */
function register(app) {
  app.view(CALLBACK_ID, async ({ ack, body, view, client, logger }) => {
    const intake = extractIntakeFields(view);
    const errors = validateIntake(intake);

    if (Object.keys(errors).length > 0) {
      await ack({ response_action: 'errors', errors });
      return;
    }

    await ack();

    const salesRep = body.user.id;
    intake.sales_rep = salesRep;

    try {
      const milestones = computeMilestones(intake.kickoff_date, {
        signoffDay: config.SIGNOFF_DAY,
        goLiveDay: config.GOLIVE_DAY,
      });

      const name = channelName(intake.restaurant_name, config.CHANNEL_PREFIX);
      const isPrivate = config.CHANNEL_VISIBILITY !== 'public';
      const channel = await createChannelWithRetry(client, name, isPrivate);

      const leadUserId = await resolveLeadUserId(client, {
        userId: config.HANDOFF_LEAD_USER_ID,
        email: config.HANDOFF_LEAD_EMAIL,
      });

      if (leadUserId) {
        await inviteUsers(client, channel.id, [leadUserId]);
      } else {
        logger.warn(
          `Could not resolve handoff lead (userId=${config.HANDOFF_LEAD_USER_ID || 'unset'}, ` +
            `email=${config.HANDOFF_LEAD_EMAIL || 'unset'}); skipping lead invite.`
        );
      }

      const teamUserIds = [salesRep, intake.csm, intake.fde, intake.ai_eng, intake.cc_lead].filter(
        (id) => id && id !== leadUserId
      );
      await inviteUsers(client, channel.id, teamUserIds);

      const summaryBlocks = buildSummaryBlocks(intake, milestones);
      const summaryMsg = await client.chat.postMessage({
        channel: channel.id,
        text: `New Zappd customer: ${intake.restaurant_name}`,
        blocks: summaryBlocks,
      });
      await client.pins.add({ channel: channel.id, timestamp: summaryMsg.ts });

      const onboardingBlocks = buildOnboardingBlocks(intake, milestones);
      const onboardingMsg = await client.chat.postMessage({
        channel: channel.id,
        text: `Onboarding plan for ${intake.restaurant_name}`,
        blocks: onboardingBlocks,
      });
      await client.pins.add({ channel: channel.id, timestamp: onboardingMsg.ts });

      if (config.HANDOFF_LOG_CHANNEL) {
        try {
          const logText = buildLogText({ ...intake, goLive: milestones.goLive }, channel.id);
          await client.chat.postMessage({ channel: config.HANDOFF_LOG_CHANNEL, text: logText });
        } catch (err) {
          logger.warn('Failed to post to HANDOFF_LOG_CHANNEL', err);
        }
      }

      // Best-effort: create the Asana onboarding project + Pipeline board
      // card. syncToAsana already catches its own errors and returns
      // { error } instead of throwing, but this is guarded too so nothing
      // here can ever take down the Slack confirmation below.
      let asanaResult;
      try {
        asanaResult = await syncToAsana({ intake, milestones, channel, logger });
      } catch (err) {
        logger.error('Unexpected error calling syncToAsana', err);
        asanaResult = { error: err };
      }

      let asanaDmLine = '';
      if (asanaResult && asanaResult.projectUrl) {
        asanaDmLine = `\n📋 Asana: <${asanaResult.projectUrl}|onboarding project> · <${asanaResult.pipelineCardUrl}|Pipeline card>`;
        await client.chat.postMessage({
          channel: channel.id,
          text: `Asana tracking created for ${intake.restaurant_name}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `📋 *Asana tracking*\n<${asanaResult.projectUrl}|Onboarding project> · <${asanaResult.pipelineCardUrl}|Pipeline card>`,
              },
            },
          ],
        });
      } else if (asanaResult && asanaResult.error) {
        asanaDmLine =
          "\n⚠️ Asana project wasn't created automatically — set it up from the TEMPLATE project.";
      }

      await dmUser(
        client,
        salesRep,
        `✅ Created <#${channel.id}> for *${intake.restaurant_name}* and looped in the onboarding team.${asanaDmLine}`
      );
    } catch (err) {
      logger.error('Intake submission failed', err);
      await dmUser(
        client,
        salesRep,
        `⚠️ Something went wrong creating the onboarding channel for *${intake.restaurant_name || 'this customer'}*. ` +
          `Please try /intake again or reach out for help. (${err && err.message ? err.message : 'unknown error'})`
      );
    }
  });
}

module.exports = { register, extractIntakeFields, validateIntake };
