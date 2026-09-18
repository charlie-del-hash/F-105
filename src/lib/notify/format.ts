import { site } from "@/config/site";
import type { AlertEvent } from "@/alerts/schema";

export function absolute(href?: string) {
  if (!href) return site.url;
  return href.startsWith("http") ? href : `${site.url.replace(/\/$/, "")}${href}`;
}

const glyph = { flash: "⚡", urgent: "●", routine: "○" } as const;

/** Plain text: WhatsApp and the email text part. */
export function formatText(e: AlertEvent) {
  return `${glyph[e.severity]} ${e.title}\n${e.body}\n${absolute(e.href)}`;
}

/** Slack Block Kit. */
export function formatSlack(e: AlertEvent) {
  return {
    text: `${glyph[e.severity]} ${e.title} — ${e.body}`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*${glyph[e.severity]} ${e.title}*\n${e.body}` } },
      { type: "context", elements: [{ type: "mrkdwn", text: `<${absolute(e.href)}|Open in ${site.name}> · ${e.ruleId} · ${e.at.slice(0, 16)}Z` }] },
    ],
  };
}

export function formatEmail(e: AlertEvent) {
  const url = absolute(e.href);
  return {
    subject: `[${site.name}] ${e.title}`,
    text: formatText(e),
    html: `<p><strong>${escapeHtml(e.title)}</strong></p><p>${escapeHtml(e.body)}</p><p><a href="${url}">Open in ${site.name}</a></p><p style="color:#888;font-size:12px">${e.ruleId} · ${e.at}</p>`,
  };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
