"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useSyncStatus } from "@/layout-engine/sync";
import { useWorkspace } from "@/layout-engine/store";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Tag } from "@/components/ui/Tag";

export function AccountPanel({ configured }: { configured: boolean }) {
  const sync = useSyncStatus();
  const layouts = useWorkspace((s) => s.layouts.length);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"idle" | "sent" | "busy">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  // Set by /auth/callback when the magic link fails.
  const urlError = useSearchParams().get("error");
  const note = msg ?? urlError;

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <div className="bezel p-4 font-ui text-sm text-ink-2">
        <div className="caps mb-2 text-ink-3">Sync is off</div>
        <p className="m-0">Your layouts, notes and theme live in this browser. To carry them across devices, connect a Supabase project: see <span className="font-data text-ink">supabase/README.md</span>. Nothing else changes.</p>
      </div>
    );
  }

  const sb = getBrowserSupabase()!;
  const sendLink = async () => {
    setPhase("busy");
    setMsg(null);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setPhase(error ? "idle" : "sent");
    setMsg(error ? error.message : `Check ${email} for a link, or paste the code from the email below.`);
  };
  const verify = async () => {
    setPhase("busy");
    const { error } = await sb.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setPhase(error ? "sent" : "idle");
    setMsg(error ? error.message : null);
  };
  const signOut = async () => {
    await sb.auth.signOut();
    setMsg("Signed out. Your workspace stays on this device.");
  };

  if (user) {
    return (
      <div className="space-y-4">
        <div className="bezel p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-ui text-sm text-ink">{user.email}</span>
            <Tag tone={sync.state === "synced" ? "up" : sync.state === "error" ? "alert" : "warn"}>{sync.state}</Tag>
            <Button size="xs" variant="ghost" onClick={signOut} className="ml-auto">Sign out</Button>
          </div>
          <p className="mt-2 font-ui text-xs text-ink-2">{sync.detail ?? "Every change is pushed a moment after you make it. Last write wins."}</p>
          <p className="mt-1 font-ui text-xs text-ink-3">{layouts} custom layout{layouts === 1 ? "" : "s"} · theme · notes · watchlist</p>
        </div>
        {note && <p className="font-ui text-xs text-ink-2">{note}</p>}
      </div>
    );
  }

  return (
    <div className="bezel max-w-md p-4">
      <div className="caps mb-2 text-ink-3">Sign in</div>
      <p className="mb-3 font-ui text-xs text-ink-2">No password. A link and a one-time code arrive by email. Signing in syncs this device&apos;s workspace; the newer copy wins.</p>
      <div className="space-y-3">
        <Field label="Email">
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={phase === "busy"} />
        </Field>
        {phase === "sent" && (
          <Field label="Code from the email" hint="Six digits. The link in the email works too.">
            <Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
          </Field>
        )}
        <div className="flex gap-2">
          {phase === "sent" ? (
            <>
              <Button variant="solid" onClick={verify} disabled={code.trim().length < 6}>Verify code</Button>
              <Button variant="ghost" onClick={sendLink}>Resend</Button>
            </>
          ) : (
            <Button variant="solid" onClick={sendLink} disabled={!email.includes("@") || phase === "busy"}>Send link</Button>
          )}
        </div>
        {note && <p className="font-ui text-xs text-ink-2">{note}</p>}
      </div>
    </div>
  );
}
