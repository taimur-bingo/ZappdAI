'use strict';

/**
 * Fixed Asana object IDs for the Zappd workspace. These identify specific,
 * one-time-created objects (a team, two projects, a section, three custom
 * fields, one enum option) rather than per-deploy configuration, so they're
 * constants rather than env vars. If the "Zappd — Onboarding Pipeline"
 * board or the TEMPLATE project is ever recreated, update the relevant
 * value here.
 */
module.exports = Object.freeze({
  // "Zappd" workspace — used to build https://app.asana.com/1/{gid}/... URLs.
  WORKSPACE_GID: '1216867179823321',

  // "Zappd" team — both projects below live in this team.
  TEAM_GID: '1216867179823323',

  // "Zappd Onboarding — TEMPLATE" — duplicated for every new restaurant.
  TEMPLATE_PROJECT_GID: '1216869017491715',

  // "Zappd — Onboarding Pipeline" — the wall-chart board, one card per
  // restaurant.
  PIPELINE_PROJECT_GID: '1216869092044355',

  // "G0 - Discovery" section on the Pipeline board — new cards land here.
  PIPELINE_G0_SECTION_GID: '1216873958348143',

  // Custom fields — same field definitions are shared by the Pipeline
  // board's cards and by every duplicated onboarding project's own tasks
  // (Asana custom fields are workspace-level, reused across projects).
  CF_KICKOFF_DATE_GID: '1216874030203366',
  CF_BLOCKED_BY_GID: '1216873759914840',
  CF_BLOCKED_SINCE_GID: '1216873778841790',

  // "Not blocked" option on the Blocked By enum field.
  CF_BLOCKED_BY_NOT_BLOCKED_OPTION_GID: '1216873759914841',
});
