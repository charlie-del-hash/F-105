# Alerts

Messaging leaves the app through the channels people already watch. Alerts are the
server-side half of that: rules evaluate the wire and the instruments, and anything new
goes to Slack, WhatsApp Business and email.

## Rules

`content/alerts/rules.json`, validated by `src/alerts/schema.ts`:

```json
{ "id": "flash-wire",     "kind": "wire",      "priorities": ["flash"], "desks": ["geo"], "channels": ["slack", "whatsapp", "email"] }
{ "id": "red-sea-premium","kind": "threshold", "symbol": "WAR.RS", "op": ">=", "value": 1.0, "channels": ["slack", "email"] }
{ "id": "ttf-move",       "kind": "move",      "symbol": "TTF", "pct": 5, "channels": ["slack"] }
```

- `wire` — a wire item with one of `priorities`, optionally limited to `desks`.
- `threshold` — the instrument's last value compared with `op` to `value`.
- `move` — day-on-day change of at least `pct` percent, either direction.

Each event has a stable key (`wire:<rule>:<item>`, `thr:<rule>:<asOf>`,
`move:<rule>:<asOf>`), so a threshold that stays breached fires once per observation
date, not once per run.

## Running

`GET /api/alerts/run` with `Authorization: Bearer $CRON_SECRET`. `vercel.json` schedules
it daily at 06:00 UTC (the Hobby plan allows daily crons; on Pro, tighten to `*/15 * * * *`).

- No `CRON_SECRET` → the route only dry-runs and says so. A fresh deployment cannot spam.
- `?dryRun=1` → evaluate and report, send nothing.
- `?test=slack` (or `whatsapp`, `email`) → one test message to that channel.

The response lists which channels are configured, which events fired, what was sent,
skipped (duplicate or unconfigured) and what failed, with the error.

## De-duplication

With `SUPABASE_SERVICE_ROLE_KEY` set, sent keys are recorded in `alert_log` and survive
deployments. Without it, memory per server instance — fine for a single test box, not
for production.

## Channels

| Channel | Mechanism | Env |
|---|---|---|
| Slack | incoming webhook, Block Kit message | `SLACK_WEBHOOK_URL` |
| WhatsApp | Business Cloud API `messages`, text or template | `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_RECIPIENTS`, optional `WHATSAPP_TEMPLATE` |
| Email | Resend | `RESEND_API_KEY`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO` |

WhatsApp delivers free-form text only inside a 24-hour customer window; for cold sends
register a template with one body parameter and set `WHATSAPP_TEMPLATE`.

## Adding a channel

`src/lib/notify/<id>.ts` exporting a `NotifierFactory` (take `fetchImpl` and `env` so it
is testable), add it to `getNotifiers`, add the id to `Channel` in the schema, and a
test in `src/alerts/alerts.test.ts`.
