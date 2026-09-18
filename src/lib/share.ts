/**
 * Messaging leaves the app through channels people already have open.
 * No in-app chat: WhatsApp Business, Slack and email carry the link.
 * Alerts (server-side push to those channels) are the notify/ adapters.
 */
export interface ShareTarget {
  id: "whatsapp" | "email" | "copy" | "native" | "slack";
  label: string;
  hint: string;
}

export const shareTargets: ShareTarget[] = [
  { id: "native", label: "Share…", hint: "System share sheet (iOS, Android, macOS)" },
  { id: "whatsapp", label: "WhatsApp", hint: "Opens a chat with the headline and link" },
  { id: "email", label: "Email", hint: "New message with the headline as subject" },
  { id: "slack", label: "Slack", hint: "Copies a Slack-ready line; paste into any channel" },
  { id: "copy", label: "Copy link", hint: "Plain URL to the clipboard" },
];

export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export async function share(target: ShareTarget["id"], payload: { title: string; text?: string; path: string }) {
  const url = absoluteUrl(payload.path);
  const line = payload.text ? `${payload.title} — ${payload.text}` : payload.title;
  switch (target) {
    case "native":
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: payload.title, text: payload.text, url });
        return "shared";
      }
      await navigator.clipboard.writeText(`${line}\n${url}`);
      return "copied";
    case "whatsapp":
      window.open(`https://wa.me/?text=${encodeURIComponent(`${line}\n${url}`)}`, "_blank", "noopener");
      return "opened";
    case "email":
      window.location.href = `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(`${payload.text ?? ""}\n\n${url}`)}`;
      return "opened";
    case "slack":
      await navigator.clipboard.writeText(`*${payload.title}*\n${payload.text ?? ""}\n<${url}>`);
      return "copied";
    case "copy":
      await navigator.clipboard.writeText(url);
      return "copied";
  }
}
