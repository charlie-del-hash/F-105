/** Slack incoming webhook. Env: SLACK_WEBHOOK_URL. */
import { formatSlack } from "./format";
import { defaultFetch, type NotifierFactory } from "./types";

export const slackNotifier: NotifierFactory = ({ fetchImpl = defaultFetch, env = process.env } = {}) => {
  const url = env.SLACK_WEBHOOK_URL;
  return {
    id: "slack",
    configured: Boolean(url),
    missing: url ? undefined : "SLACK_WEBHOOK_URL",
    async send(event) {
      const res = await fetchImpl(url!, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(formatSlack(event)) });
      if (!res.ok) throw new Error(`Slack webhook HTTP ${res.status}`);
    },
  };
};
