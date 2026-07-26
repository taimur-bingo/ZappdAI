# ZappdAI

A Slack app for [Zappd](https://zappd.ai) — an AI-powered restaurant ordering
platform. ZappdAI closes the gap between the sales team closing a deal and
the post-sales team onboarding the restaurant.

## The problem

When a sales rep closes a restaurant contract, everything they learned
during the sale — the decision maker, the POS system, which delivery
platforms the restaurant uses, the agreed kickoff date — lives in their
head, a CRM, or a Slack DM. The post-sales team starts onboarding from
scratch, re-asking questions the rep already answered, and there's no
single place where sales and post-sales are both looking at the same
information.

ZappdAI fixes that with one slash command.

## The `/intake` flow

1. A sales rep runs `/intake` in Slack right after a contract closes.
2. A modal collects the full presales → postsales handoff: business &
   contact info, contract terms, the restaurant's current tech stack, and
   who owns onboarding.
3. On submit, the app:
   - Creates a private customer onboarding channel (`cust-<restaurant-name>`
     by default).
   - Adds the **post-sales lead** (`khantaimur@icloud.com` by default) to
     the channel **first**.
   - Invites the sales rep and the assigned team (CSM, FDE, AI/Engineering,
     Command Center Lead).
   - Posts and **pins** a handoff summary of everything captured in the
     modal.
   - Posts and **pins** a ~10-day onboarding plan tailored to the kickoff
     date.
   - Optionally logs a one-line summary to an internal handoff log channel.
   - **Optionally** (if `ASANA_ACCESS_TOKEN` is set) duplicates the Asana
     onboarding template into a new tracking project for the restaurant and
     adds a card to the Pipeline board — see [Asana sync](#asana-sync)
     below.
   - DMs the rep a confirmation (or a clear error if something failed).

## Intake fields

### 🏢 Business & Contact
`restaurant_name`\*, `legal_business_name`, `business_address`\*, `location`
(market), `number_of_locations`, `decision_maker_name`\*,
`decision_maker_role`, `decision_maker_email`\*, `decision_maker_phone`\*,
`billing_contact`

### 📄 Contract
`close_date`, `acv`\*, `contract_term`\* (Month-to-month / 6 months / 1 year
/ 2 years / 3 years / Other), `billing_cadence` (Monthly / Quarterly /
Annual / Other), `contract_link`

### 🍽️ Restaurant Stack
`kickoff_date`\*, `pos_system`\* (Toast / Square / Clover / Other),
`pos_details`, `ordering_platforms`\* (DoorDash / Uber Eats /
Seamless-Grubhub / Direct Website / Other, multi-select), `source_of_truth`\*
(same platforms + Undecided), `comm_channels` (Cellphone / Landline /
WhatsApp / Instagram / Facebook, multi-select), `phone_plan` (Dedicated
cellphone / Shared cellphone / Landline SMS-enablement / New cell line /
TBD), `menu_notes`

### 👥 Team & Handoff
`csm`\*, `fde`, `ai_eng`, `cc_lead`, `handoff_notes`

\* required

## The ~10-day onboarding plan

Six phases, run mostly in parallel, anchored to the kickoff date:

| Phase | Days | Owner(s) |
|---|---|---|
| 0. Kickoff & Discovery | Day 1 | CSM, FDE |
| 1. Comm Channel Provisioning | Days 1–3 | FDE, CSM |
| 2. Menu Centralization (**critical path**) | Days 1–7 | CSM, FDE |
| 3. Zappd Platform Provisioning | Days 6–8 | AI/Engineering, Command Center Lead |
| 4. Owner Review & Revisions | Days 8–9 | CSM, AI/Engineering |
| 5. Go-Live & Handoff | Days 9–10 | CSM, Command Center Lead |

Menu Centralization is the critical path: everything downstream (platform
provisioning, owner review, go-live) depends on a canonical menu spec that
reconciles the POS with every ordering platform.

## Asana sync

Set `ASANA_ACCESS_TOKEN` in `.env` (see `.env.example`) and every `/intake`
submission will also, in the same request:

1. Duplicate **"Zappd Onboarding — TEMPLATE"** into a new
   `Zappd Onboarding — {restaurant}` project (all 6 phases / 51 tasks
   intact) and write the intake summary into its notes.
2. Add a card for the restaurant to the **"Zappd — Onboarding Pipeline"**
   wall-chart board (G0 - Discovery section), with the Kickoff Date and
   "Not blocked" fields pre-filled and the due date set to kickoff + 20
   days (the board's own convention for target go-live).
3. Post both links back into the new Slack channel and the sales rep's
   confirmation DM.

Leave `ASANA_ACCESS_TOKEN` unset and the app behaves exactly as it did
before this integration existed — this step is entirely optional and
fails soft (a Slack-side error there never blocks channel creation).

One thing this **doesn't** do yet: set the Pipeline card's "Onboarding
Lead" field — that's a person field, and there's no Slack-user↔Asana-user
mapping in this codebase, so a human still sets it once per card (the CSM
is already visible in the channel and the card notes).

New projects and cards created this way show up automatically in the
"Zappd Onboarding Pipeline" status dashboard on its next refresh — no
extra wiring needed, it discovers projects by team.

Try it without a live Slack workspace: `npm run asana-demo` (see
[Development](#development)) creates a real, obviously-named demo project
and card you can open and then delete.

## Setup

1. Create a Slack app from `manifest.yml` (**Create New App → From a
   manifest**), or paste its contents into an existing app's manifest.
2. Install the app to your workspace and collect the tokens it gives you:
   `SLACK_BOT_TOKEN` (bot token, `xoxb-…`), and for Socket Mode a
   `SLACK_APP_TOKEN` (app-level token, `xapp-…`) with the `connections:write`
   scope. For HTTP mode instead, grab `SLACK_SIGNING_SECRET`.
3. Copy `.env.example` to `.env` and fill in your tokens. See
   [`docs/SETUP.md`](docs/SETUP.md) for the full walkthrough, including how
   to switch between Socket Mode and HTTP mode.
4. Install dependencies and run:

   ```bash
   npm install
   npm start
   ```

5. Run `/intake` in any channel the bot is in.

## Development

```bash
npm install       # install dependencies
npm test          # run the unit tests (node --test)
npm run demo      # print a sample channel name, timeline, and Block Kit payloads — no Slack connection needed
npm run asana-demo  # LIVE: creates a real demo project + Pipeline card via the Asana API (needs ASANA_ACCESS_TOKEN)
```

The pure logic (`src/utils/*`, `src/onboarding.js`, `src/asana/format.js`)
has zero dependency on `@slack/bolt` or `dotenv`, so `npm test` runs even
without `npm install`.

## Customizing

- **Fields**: add, remove, or reorder intake questions in
  [`src/intakeForm.js`](src/intakeForm.js); update
  [`src/handlers/submission.js`](src/handlers/submission.js) if you add a
  required field, and [`src/utils/format.js`](src/utils/format.js) to
  surface it in the pinned summary.
- **Timeline**: change `SIGNOFF_DAY` / `GOLIVE_DAY` in `.env`, or edit the
  phases and tasks in [`src/onboarding.js`](src/onboarding.js).
- **Channel naming/visibility**: `CHANNEL_PREFIX` and `CHANNEL_VISIBILITY`
  in `.env`.
- **Handoff lead**: `HANDOFF_LEAD_EMAIL` / `HANDOFF_LEAD_USER_ID` in `.env`.
- **Asana sync**: workspace-specific IDs (template/pipeline project, custom
  fields) live in [`src/asana/constants.js`](src/asana/constants.js); the
  notes written into the new project/card come from
  [`src/asana/format.js`](src/asana/format.js).

## Tech

Node.js ≥ 18, CommonJS, [`@slack/bolt`](https://slack.dev/bolt-js) ^3.19,
`dotenv`. Supports Socket Mode (default) and HTTP mode. Asana sync uses
Node's built-in `fetch` against the Asana REST API directly — no added
dependency. Tests use Node's built-in test runner (`node --test`) — no test
framework dependency.
