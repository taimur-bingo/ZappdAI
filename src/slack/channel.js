'use strict';

/**
 * Create the customer onboarding channel.
 * @param {import('@slack/web-api').WebClient} client
 * @param {{name: string, isPrivate: boolean}} opts
 * @returns {Promise<{id: string, name: string}>}
 */
async function createHandoffChannel(client, { name, isPrivate }) {
  const result = await client.conversations.create({
    name,
    is_private: !!isPrivate,
  });

  return { id: result.channel.id, name: result.channel.name };
}

/**
 * Resolve the post-sales handoff lead's Slack user ID. Prefers a directly
 * configured user ID; falls back to an email lookup. Never throws — a
 * failed lookup resolves to null so the caller can proceed and warn.
 * @param {import('@slack/web-api').WebClient} client
 * @param {{userId?: string, email?: string}} opts
 * @returns {Promise<string|null>}
 */
async function resolveLeadUserId(client, { userId, email } = {}) {
  if (userId) return userId;
  if (!email) return null;

  try {
    const result = await client.users.lookupByEmail({ email });
    return (result && result.user && result.user.id) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Invite a list of users to a channel, deduping/filtering falsy IDs and
 * tolerating members who are already in the channel.
 * @param {import('@slack/web-api').WebClient} client
 * @param {string} channelId
 * @param {Array<string|null|undefined>} userIds
 * @returns {Promise<{invited: string[], skipped: string[]}>}
 */
async function inviteUsers(client, channelId, userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (unique.length === 0) return { invited: [], skipped: [] };

  try {
    await client.conversations.invite({ channel: channelId, users: unique.join(',') });
    return { invited: unique, skipped: [] };
  } catch (err) {
    if (err && err.data && err.data.error === 'already_in_channel') {
      return { invited: unique, skipped: [] };
    }
    throw err;
  }
}

module.exports = { createHandoffChannel, resolveLeadUserId, inviteUsers };
