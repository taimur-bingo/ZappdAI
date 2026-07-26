# Setup

## 1. Create the Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New
   App → From an app manifest**.
2. Pick the workspace, paste in the contents of [`manifest.yml`](../manifest.yml),
   and confirm. This creates the `ZappdAI` bot with the `/intake` slash
   command, interactivity, and Socket Mode already configured, plus every
   bot scope the app needs:
   - `commands` — register/receive `/intake`
   - `chat:write` — post the summary, onboarding plan, and DMs
   - `channels:manage` — create public onboarding channels
   - `groups:write` — create/manage private onboarding channels
   - `channels:read` / `groups:read` — look up channel info (retry-on-taken)
   - `users:read` / `users:read.email` — resolve the handoff lead by email
   - `pins:write` — pin the summary and onboarding plan
   - `im:write` — DM the sales rep a confirmation or error
3. **Install App** to your workspace.

## 2. Collect credentials

- **Bot token** (`SLACK_BOT_TOKEN`): Settings → **Install App** →
  "Bot User OAuth Token" (`xoxb-…`).
- **Socket Mode** (default, no public URL needed):
  - Settings → **Socket Mode** → enable it.
  - Settings → **Basic Information** → **App-Level Tokens** → generate one
    with the `connections:write` scope. This is `SLACK_APP_TOKEN`
    (`xapp-…`).
- **HTTP Mode** (if you'd rather run behind a public URL):
  - Settings → **Basic Information** → copy the **Signing Secret** into
    `SLACK_SIGNING_SECRET`.
  - Settings → **Socket Mode** → disable it.
  - Settings → **Interactivity & Shortcuts** and **Slash Commands** →
    point the request URLs at your public host (e.g.
    `https://your-host/slack/events`).
  - Set `SOCKET_MODE=false` in `.env`.

## 3. Configure the app

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `SLACK_BOT_TOKEN` | — | Bot token, required always |
| `SLACK_APP_TOKEN` | — | App-level token, required for Socket Mode |
| `SLACK_SIGNING_SECRET` | — | Required for HTTP mode |
| `SOCKET_MODE` | `true` | `true` = Socket Mode, `false` = HTTP mode |
| `PORT` | `3000` | HTTP mode listen port |
| `HANDOFF_LEAD_EMAIL` | `khantaimur@icloud.com` | Post-sales lead added first to every channel |
| `HANDOFF_LEAD_USER_ID` | — | If set, wins over `HANDOFF_LEAD_EMAIL` (skips the lookup) |
| `HANDOFF_LOG_CHANNEL` | — | Optional channel to post a one-line log per intake |
| `CHANNEL_PREFIX` | `cust-` | Prefix for generated channel names |
| `CHANNEL_VISIBILITY` | `private` | `private` or `public` |
| `SIGNOFF_DAY` | `7` | Days after kickoff for menu sign-off milestone |
| `GOLIVE_DAY` | `10` | Days after kickoff for go-live milestone |
| `ASANA_ACCESS_TOKEN` | — | Optional. Enables auto-creating the Asana onboarding project + Pipeline card (see below) |

`config.validate()` throws a clear error at startup if a required token for
your chosen mode is missing. `ASANA_ACCESS_TOKEN` is **not** in that
required list — leave it unset and the app runs Slack-only, as before.

## 4. (Optional) Connect Asana

1. In Asana: your profile photo → **My Settings** → **Apps** → **Manage
   Developer Apps** → **Personal Access Tokens** → **Create new token**.
2. Put the value in your local `.env` as `ASANA_ACCESS_TOKEN` — **never**
   commit it or paste it anywhere else; `.env` is already gitignored.
3. Sanity-check it works before wiring up Slack:

   ```bash
   npm run asana-demo
   ```

   This makes real Asana API calls — it duplicates the real onboarding
   template and adds a real card to the real Pipeline board, using an
   obviously-fake demo restaurant name so you can find and delete it
   afterward. Open the two printed URLs to confirm they look right.

The workspace-specific IDs this relies on (the template project, the
Pipeline board, its custom fields) are in
[`../src/asana/constants.js`](../src/asana/constants.js) — update them
there if those Asana objects are ever recreated.

## 5. Install, run, test

```bash
npm install
npm start   # runs app.js, connects to Slack
npm test    # node --test — runs with zero installed deps
npm run demo   # prints a sample channel name, timeline, and Block Kit JSON, no Slack connection
npm run asana-demo   # LIVE: exercises the real Asana API (needs ASANA_ACCESS_TOKEN) — see step 4
```

## 6. Try it

In any channel the bot has been added to (or any channel, for the slash
command itself), run:

```
/intake
```

Fill out the modal and hit **Create Channel**. You should see a new private
channel appear with the post-sales lead, you, and your assigned team in it,
and a pinned summary + onboarding plan waiting inside.
