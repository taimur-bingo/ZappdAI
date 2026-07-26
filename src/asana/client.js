'use strict';

const config = require('../config');

const BASE_URL = 'https://app.asana.com/api/1.0';

/**
 * Thin wrapper around the Asana REST API using Node's built-in fetch.
 * Throws a descriptive Error (including Asana's own error message, if any)
 * on any non-2xx response.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path - e.g. '/projects/123/duplicate'
 * @param {object} [body] - sent as { data: body }
 * @returns {Promise<any>} the parsed `data` field of Asana's response
 */
async function asanaRequest(method, path, body) {
  if (!config.ASANA_ACCESS_TOKEN) {
    throw new Error('ASANA_ACCESS_TOKEN is not set; cannot call the Asana API.');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.ASANA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify({ data: body }) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    json = {};
  }

  if (!res.ok) {
    const asanaMessage =
      json && Array.isArray(json.errors) && json.errors[0] && json.errors[0].message;
    throw new Error(
      `Asana API ${method} ${path} failed (${res.status}): ${asanaMessage || text || res.statusText}`
    );
  }

  return json.data;
}

module.exports = { asanaRequest, BASE_URL };
