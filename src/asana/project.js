'use strict';

const { asanaRequest } = require('./client');
const { WORKSPACE_GID, TEAM_GID, TEMPLATE_PROJECT_GID } = require('./constants');

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 20; // ~30s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the permalink URL for an Asana project in the Zappd workspace.
 * @param {string} projectGid
 * @returns {string}
 */
function projectUrl(projectGid) {
  return `https://app.asana.com/1/${WORKSPACE_GID}/project/${projectGid}/list`;
}

/**
 * Poll an Asana duplicate job until it succeeds or fails.
 * @param {string} jobGid
 * @returns {Promise<object>} the finished job resource
 */
async function waitForJob(jobGid) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const job = await asanaRequest('GET', `/jobs/${jobGid}`);

    if (job.status === 'succeeded') return job;
    if (job.status === 'failed') {
      throw new Error(`Asana duplicate job ${jobGid} failed: ${JSON.stringify(job.errors || job)}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Asana duplicate job ${jobGid} did not finish within ${MAX_POLL_ATTEMPTS} attempts.`);
}

/**
 * Duplicate the "Zappd Onboarding — TEMPLATE" project (51 tasks / 6 phases)
 * into a new project for one restaurant, and wait for the copy to finish.
 * @param {{name: string}} opts
 * @returns {Promise<{projectGid: string, projectUrl: string}>}
 */
async function duplicateOnboardingProject({ name }) {
  const job = await asanaRequest('POST', `/projects/${TEMPLATE_PROJECT_GID}/duplicate`, {
    name,
    team: TEAM_GID,
    include: [
      'forms',
      'members',
      'notes',
      'task_assignee',
      'task_attachments',
      'task_dates',
      'task_dependencies',
      'task_followers',
      'task_notes',
      'task_projects',
      'task_subtasks',
      'task_tags',
    ],
  });

  const projectGid = job && job.new_project && job.new_project.gid;
  if (!projectGid) {
    throw new Error('Asana duplicate response did not include a new_project gid.');
  }

  await waitForJob(job.gid);

  return { projectGid, projectUrl: projectUrl(projectGid) };
}

/**
 * Overwrite a project's notes field (used to write the intake summary onto
 * the freshly duplicated project).
 * @param {{projectGid: string, notes: string}} opts
 */
async function updateProjectNotes({ projectGid, notes }) {
  await asanaRequest('PUT', `/projects/${projectGid}`, { notes });
}

module.exports = { duplicateOnboardingProject, updateProjectNotes, projectUrl };
