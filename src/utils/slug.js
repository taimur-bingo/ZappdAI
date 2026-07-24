'use strict';

const MAX_CHANNEL_NAME_LENGTH = 80;
const FALLBACK_NAME = 'customer';

/**
 * Convert an arbitrary string into a lowercase, hyphenated slug containing
 * only [a-z0-9-_]. Pure function, no external dependencies.
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  if (typeof str !== 'string') return '';

  const slug = str
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Build a Slack-safe channel name from a company name, e.g.
 * channelName("Mario's Pizzeria", "cust-") -> "cust-marios-pizzeria"
 * Falls back to a generic name if slugification produces nothing usable.
 * @param {string} companyName
 * @param {string} [prefix]
 * @returns {string}
 */
function channelName(companyName, prefix = '') {
  const base = slugify(companyName) || FALLBACK_NAME;
  const safePrefix = slugify(prefix);
  const combined = safePrefix ? `${safePrefix}-${base}` : base;

  const trimmed = combined
    .slice(0, MAX_CHANNEL_NAME_LENGTH)
    .replace(/-+$/, '');

  return trimmed || FALLBACK_NAME;
}

module.exports = { slugify, channelName, MAX_CHANNEL_NAME_LENGTH };
