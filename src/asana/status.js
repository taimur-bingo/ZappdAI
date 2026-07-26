'use strict';

const { asanaRequest } = require('./client');
const { PHASES } = require('./phases');
const {
  TEAM_GID,
  TEMPLATE_PROJECT_GID,
  PIPELINE_PROJECT_GID,
  CF_KICKOFF_DATE_GID,
  CF_BLOCKED_BY_GID,
  CF_BLOCKED_SINCE_GID,
} = require('./constants');
const { projectUrl } = require('./project');

// Matches how duplicateOnboardingProject() (src/asana/project.js) names new
// projects. The 4 restaurants that predate this integration use bare names
// with no prefix — both forms are handled below.
const PROJECT_NAME_PREFIX = 'Zappd Onboarding — ';

// Per the Pipeline board's own template card: "G5 LIVE ... Day 20", with
// "Kickoff Date (Day 0)" as the zero point.
const TOTAL_TARGET_DAYS = 20;

function restaurantDisplayName(projectName) {
  return projectName.startsWith(PROJECT_NAME_PREFIX)
    ? projectName.slice(PROJECT_NAME_PREFIX.length)
    : projectName;
}

/**
 * List every restaurant onboarding project in the Zappd team — everything
 * except the TEMPLATE and the Pipeline board itself, and anything archived.
 * @returns {Promise<Array<{gid: string, name: string}>>}
 */
async function fetchRestaurantProjects() {
  const projects = await asanaRequest(
    'GET',
    `/projects?team=${TEAM_GID}&archived=false&opt_fields=name,archived`
  );

  return (projects || []).filter(
    (p) => p.gid !== TEMPLATE_PROJECT_GID && p.gid !== PIPELINE_PROJECT_GID && !p.archived
  );
}

/**
 * Build a map of restaurant display name -> Kickoff Date (Date object or
 * null) from the Pipeline board's cards. Cards with no Kickoff Date set
 * (including the TEMPLATE CARD / READ ME cards, which never have one)
 * simply map to null and get skipped by callers.
 * @returns {Promise<Map<string, Date|null>>}
 */
async function fetchPipelineKickoffMap() {
  const tasks = await asanaRequest(
    'GET',
    `/projects/${PIPELINE_PROJECT_GID}/tasks?opt_fields=name,custom_fields.gid,custom_fields.display_value`
  );

  const map = new Map();
  (tasks || []).forEach((t) => {
    const field = (t.custom_fields || []).find((f) => f.gid === CF_KICKOFF_DATE_GID);
    const value = field && field.display_value ? new Date(field.display_value) : null;
    map.set(t.name, value && !Number.isNaN(value.getTime()) ? value : null);
  });

  return map;
}

async function fetchProjectTasks(projectGid) {
  return asanaRequest(
    'GET',
    `/projects/${projectGid}/tasks?opt_fields=name,completed,memberships.section.name,custom_fields.gid,custom_fields.display_value`
  );
}

/**
 * Classify one project's tasks into a gate/blocker summary. Pure given
 * `tasks` — no Asana calls in here.
 * @param {Array<object>} tasks
 * @param {Date} now
 * @returns {{currentPhaseIdx: number|null, isLive: boolean, blockers: Array<{who: string, task: string, since: Date|null, hoursAged: number|null}>}}
 */
function classifyTasks(tasks, now) {
  const list = tasks || [];
  const phaseStats = PHASES.map(() => ({ total: 0, completed: 0 }));
  const blockers = [];
  let completedCount = 0;

  list.forEach((t) => {
    if (t.completed) completedCount++;

    const sectionName =
      (t.memberships && t.memberships[0] && t.memberships[0].section && t.memberships[0].section.name) ||
      '';
    const phase = PHASES.find((p) => sectionName.indexOf(p.match) === 0);
    if (phase) {
      phaseStats[phase.idx].total++;
      if (t.completed) phaseStats[phase.idx].completed++;
    }

    let blockedBy = null;
    let blockedSince = null;
    (t.custom_fields || []).forEach((f) => {
      if (f.gid === CF_BLOCKED_BY_GID && f.display_value) blockedBy = f.display_value;
      if (f.gid === CF_BLOCKED_SINCE_GID && f.display_value) blockedSince = f.display_value;
    });

    if (blockedBy && blockedBy !== 'Not blocked') {
      const sinceDate = blockedSince ? new Date(blockedSince) : null;
      const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;
      blockers.push({
        who: blockedBy,
        task: t.name,
        since: validSince,
        hoursAged: validSince ? (now - validSince) / (60 * 60 * 1000) : null,
      });
    }
  });

  let currentPhaseIdx = null;
  for (let i = 0; i < PHASES.length; i++) {
    const ps = phaseStats[i];
    if (ps.total === 0) continue;
    if (ps.completed < ps.total) {
      currentPhaseIdx = i;
      break;
    }
  }

  const isLive = list.length > 0 && completedCount === list.length;

  return { currentPhaseIdx, isLive, blockers };
}

/**
 * Fetch and classify every restaurant's onboarding status: current gate,
 * day count (from the Pipeline board's Kickoff Date), and any active
 * blockers. This is the single Asana-facing entry point the daily digest
 * (and any future consumer) should call.
 * @param {{now?: Date}} [opts]
 * @returns {Promise<Array<{name: string, projectUrl: string, currentPhaseIdx: number|null, isLive: boolean, dayCount: number|null, blockers: Array<object>}>>}
 */
async function fetchOnboardingStatuses(opts = {}) {
  const now = opts.now || new Date();

  const [projects, kickoffMap] = await Promise.all([
    fetchRestaurantProjects(),
    fetchPipelineKickoffMap(),
  ]);

  return Promise.all(
    projects.map(async (p) => {
      const displayName = restaurantDisplayName(p.name);
      const tasks = await fetchProjectTasks(p.gid);
      const { currentPhaseIdx, isLive, blockers } = classifyTasks(tasks, now);

      const kickoff = kickoffMap.get(displayName) || null;
      const dayCount = kickoff ? Math.floor((now - kickoff) / (24 * 60 * 60 * 1000)) : null;

      return {
        name: displayName,
        projectUrl: projectUrl(p.gid),
        currentPhaseIdx,
        isLive,
        dayCount,
        totalTargetDays: TOTAL_TARGET_DAYS,
        blockers,
      };
    })
  );
}

module.exports = { fetchOnboardingStatuses, classifyTasks, restaurantDisplayName };
