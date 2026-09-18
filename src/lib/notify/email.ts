/** Email via Resend. Env: RESEND_API_KEY, ALERT_EMAIL_FROM, ALERT_EMAIL_TO (comma-separated). */
import { formatEmail } from "./format";
import { defaultFetch, type NotifierFactory } from "./types";

export const emailNotifier: NotifierFactory = ({ fetchImpl = defaultFetch, env = process.env } = {}) => {
  const key = env.RESEND_API_KEY;
  const from = env.ALERT_EMAIL_FROM;
  const to = (env.ALERT_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const configured = Boolean(key && from && to.length);
  const missing = [!key && "RESEND_API_KEY", !from && "ALERT_EMAIL_FROM", !to.length && "ALERT_EMAIL_TO"].filter(Boolean).join(", ");
  return {
    id: "email",
    configured,
    missing: configured ? undefined : missing,
    async send(event) {
      const { subject, text, html } = formatEmail(event);
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ from, to, subject, text, html }),
      });
      if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
    },
  };
};
