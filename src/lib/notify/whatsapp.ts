/**
 * WhatsApp Business Cloud API (Meta Graph). Env: WHATSAPP_BUSINESS_TOKEN,
 * WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_RECIPIENTS (comma-separated E.164 numbers).
 *
 * Free-form text is only delivered inside a 24-hour customer-service window; for
 * cold sends Meta requires an approved template. Set WHATSAPP_TEMPLATE to the
 * template name (with one body parameter) to use template sends instead.
 */
import { formatText } from "./format";
import { defaultFetch, type NotifierFactory } from "./types";

export const whatsappNotifier: NotifierFactory = ({ fetchImpl = defaultFetch, env = process.env } = {}) => {
  const token = env.WHATSAPP_BUSINESS_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const recipients = (env.WHATSAPP_RECIPIENTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const template = env.WHATSAPP_TEMPLATE;
  const configured = Boolean(token && phoneId && recipients.length);
  const missing = [!token && "WHATSAPP_BUSINESS_TOKEN", !phoneId && "WHATSAPP_PHONE_NUMBER_ID", !recipients.length && "WHATSAPP_RECIPIENTS"].filter(Boolean).join(", ");
  return {
    id: "whatsapp",
    configured,
    missing: configured ? undefined : missing,
    async send(event) {
      const body = formatText(event);
      const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
      await Promise.all(
        recipients.map(async (to) => {
          const payload = template
            ? { messaging_product: "whatsapp", to, type: "template", template: { name: template, language: { code: env.WHATSAPP_TEMPLATE_LANG ?? "en" }, components: [{ type: "body", parameters: [{ type: "text", text: body.slice(0, 1000) }] }] } }
            : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: true, body } };
          const res = await fetchImpl(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error(`WhatsApp HTTP ${res.status} for ${to}`);
        }),
      );
    },
  };
};
