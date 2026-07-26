'use strict';

/**
 * The 6 onboarding gates, matched against a task's section name by prefix
 * (e.g. a task in "Phase 2 — Menu Centralization ⚠️ CRITICAL PATH (Day
 * 1–13)" matches `match: 'Phase 2'`). Kept in sync with the identical
 * PHASES table in dashboards/onboarding-dashboard.html — both read the
 * same Asana project structure the same way.
 */
const PHASES = Object.freeze([
  { idx: 0, gate: 'G0', name: 'Discovery', match: 'Phase 0' },
  { idx: 1, gate: 'G1', name: 'Comms', match: 'Phase 1' },
  { idx: 2, gate: 'G2', name: 'Menu', match: 'Phase 2' },
  { idx: 3, gate: 'G3', name: 'Platform', match: 'Phase 3' },
  { idx: 4, gate: 'G4', name: 'Owner review', match: 'Phase 4' },
  { idx: 5, gate: 'G5', name: 'Go-live', match: 'Phase 5' },
]);

module.exports = { PHASES };
