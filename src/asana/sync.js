'use strict';

const config = require('../config');
const { addDays } = require('../utils/timeline');
const { duplicateOnboardingProject, updateProjectNotes } = require('./project');
const { createPipelineCard } = require('./pipelineCard');
const { buildProjectNotes, buildPipelineCardNotes } = require('./format');

// Per the Pipeline board's own template card: "DUE DATE = TARGET GO-LIVE
// ... Set it to Kickoff + 20 days at kickoff."
const PIPELINE_CARD_DUE_OFFSET_DAYS = 20;

/**
 * Create the onboarding project (duplicated from TEMPLATE) and the matching
 * "Zappd — Onboarding Pipeline" board card for one new customer, and write
 * the intake summary into both. Best-effort: if ASANA_ACCESS_TOKEN isn't
 * set, this no-ops so the app still runs without Asana configured. Any
 * failure is caught and returned as { error } rather than thrown, so it
 * never breaks the Slack flow that already succeeded by the time this runs.
 * @param {{intake: object, milestones: object, channel: {id: string, name: string}, logger?: object}} opts
 * @returns {Promise<{projectUrl: string, pipelineCardUrl: string}|{skipped: true}|{error: Error}>}
 */
async function syncToAsana({ intake, milestones, channel, logger }) {
  if (!config.ASANA_ACCESS_TOKEN) {
    if (logger) logger.info('ASANA_ACCESS_TOKEN not set; skipping Asana sync.');
    return { skipped: true };
  }

  try {
    const { projectGid, projectUrl } = await duplicateOnboardingProject({
      name: `Zappd Onboarding — ${intake.restaurant_name}`,
    });

    const projectNotes = buildProjectNotes(intake, milestones, { channelName: channel.name });
    await updateProjectNotes({ projectGid, notes: projectNotes });

    const kickoff = milestones && milestones.kickoff;
    const dueOn = kickoff ? addDays(kickoff, PIPELINE_CARD_DUE_OFFSET_DAYS) : null;
    const pipelineNotes = buildPipelineCardNotes(intake, { projectUrl, channelName: channel.name });

    const { taskUrl: pipelineCardUrl } = await createPipelineCard({
      name: intake.restaurant_name,
      kickoffDate: kickoff,
      dueOn,
      notes: pipelineNotes,
    });

    return { projectUrl, pipelineCardUrl };
  } catch (err) {
    if (logger) logger.error('Asana sync failed', err);
    return { error: err };
  }
}

module.exports = { syncToAsana };
