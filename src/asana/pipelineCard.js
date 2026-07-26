'use strict';

const { asanaRequest } = require('./client');
const {
  PIPELINE_PROJECT_GID,
  PIPELINE_G0_SECTION_GID,
  CF_KICKOFF_DATE_GID,
  CF_BLOCKED_BY_GID,
  CF_BLOCKED_BY_NOT_BLOCKED_OPTION_GID,
} = require('./constants');

/**
 * Create a card for a new restaurant on the "Zappd — Onboarding Pipeline"
 * wall-chart board, in the "G0 - Discovery" section, with Kickoff Date and
 * Blocked By ("Not blocked") pre-filled. Onboarding Lead (a people field)
 * is intentionally left unset — see the Asana-sync plan for why.
 * @param {{name: string, kickoffDate: string|null, dueOn: string|null, notes: string}} opts
 * @returns {Promise<{taskGid: string, taskUrl: string}>}
 */
async function createPipelineCard({ name, kickoffDate, dueOn, notes }) {
  const customFields = {};
  if (kickoffDate) customFields[CF_KICKOFF_DATE_GID] = { date: kickoffDate };
  customFields[CF_BLOCKED_BY_GID] = CF_BLOCKED_BY_NOT_BLOCKED_OPTION_GID;

  const task = await asanaRequest('POST', '/tasks?opt_fields=gid,permalink_url', {
    name,
    notes,
    due_on: dueOn || null,
    projects: [PIPELINE_PROJECT_GID],
    memberships: [{ project: PIPELINE_PROJECT_GID, section: PIPELINE_G0_SECTION_GID }],
    custom_fields: customFields,
  });

  return { taskGid: task.gid, taskUrl: task.permalink_url };
}

module.exports = { createPipelineCard };
