import { Suspense } from "react";
import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AccountPanel } from "./AccountPanel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <h1 className="caps mb-1 text-ink-3">Account</h1>
      <p className="mb-6 max-w-2xl font-ui text-sm text-ink-2">Sign in to keep the same desk on your phone, laptop and the office screen. Without an account everything still works; it just stays where you made it.</p>
      {/* The panel reads ?error= from the auth callback on the client, so this
          page stays static and the GitHub Pages export can prerender it. */}
      <Suspense fallback={null}>
        <AccountPanel configured={isSupabaseConfigured()} />
      </Suspense>
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["What syncs", "Custom layouts, active layout, theme, notes, watchlist."],
          ["What does not", "Presets and content live in the build. Alerts are configured on the server."],
          ["Conflicts", "Last write wins by timestamp. Export a layout as JSON before experimenting."],
        ].map(([t, b]) => (
          <div key={t} className="bezel p-3">
            <div className="caps text-ink-3">{t}</div>
            <p className="m-0 mt-1 font-ui text-xs text-ink-2">{b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
