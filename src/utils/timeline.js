'use strict';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DEFAULT_SIGNOFF_DAY = 7;
const DEFAULT_GOLIVE_DAY = 10;

/**
 * Parse a "YYYY-MM-DD" string into a UTC epoch-ms value, or null if invalid.
 * @param {string} dateStr
 * @returns {number|null}
 */
function parseUtcDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const match = DATE_RE.exec(dateStr);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  // Guard against overflowed values like 2026-02-31 silently rolling over.
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return ms;
}

/**
 * Format a UTC epoch-ms value as "YYYY-MM-DD".
 * @param {number} ms
 * @returns {string}
 */
function formatUtcDate(ms) {
  const d = new Date(ms);
  const year = String(d.getUTCFullYear()).padStart(4, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add n days to a "YYYY-MM-DD" date string, UTC-safe (no DST/timezone
 * drift). Returns null for invalid input instead of throwing.
 * @param {string} dateStr
 * @param {number} n
 * @returns {string|null}
 */
function addDays(dateStr, n) {
  const ms = parseUtcDate(dateStr);
  if (ms === null || typeof n !== 'number' || Number.isNaN(n)) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return formatUtcDate(ms + n * MS_PER_DAY);
}

/**
 * Compute the ~10-day onboarding milestone dates from a kickoff date.
 * Never throws; invalid input yields null values for every field.
 * @param {string} kickoff "YYYY-MM-DD"
 * @param {{signoffDay?: number, goLiveDay?: number}} [opts]
 * @returns {{kickoff: string|null, nomenclatureSignOff: string|null, goLive: string|null}}
 */
function computeMilestones(kickoff, opts = {}) {
  const { signoffDay = DEFAULT_SIGNOFF_DAY, goLiveDay = DEFAULT_GOLIVE_DAY } = opts || {};

  const validKickoff = parseUtcDate(kickoff) !== null ? kickoff : null;

  return {
    kickoff: validKickoff,
    nomenclatureSignOff: validKickoff ? addDays(validKickoff, signoffDay) : null,
    goLive: validKickoff ? addDays(validKickoff, goLiveDay) : null,
  };
}

module.exports = { addDays, computeMilestones };
