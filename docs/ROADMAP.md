# Roadmap

Ordered by leverage. Each item is a session or two of agentic work with the recipes in `CLAUDE.md`.

1. **Real data, one provider at a time.** Energy first (ICE/EEX via a licensed feed),
   then freight (Baltic via Clarksons SIN / SSY), then the indicators (AIS-derived transit
   counts). Keep the mock as the fallback and for tests.
2. **Persistence and identity.** Supabase: auth, a `workspaces` table holding the store's
   persisted shape, RLS per user, a `StorageAdapter` behind the Zustand persist middleware.
   Layout sharing by link follows for free.
3. **Alerts.** `src/lib/notify/` with Slack, WhatsApp Business and email adapters; rules on
   wire priority and indicator thresholds; a Vercel cron to evaluate them.
4. **More panels.** News search (Bigdata.com), equity tearsheet (viaNexus), fixtures list,
   vessel tracker (real AIS in the plot), a "compare" chart (two instruments indexed to 100,
   never dual-axis).
5. **Editorial workflow.** Draft mode, scheduled publishing, an image pipeline for heroes.
6. **Theme Thunder for the terminal.** Period-correct special editions of a piece — the
   1987 flash terminal, the CIC plot — as full-page themes that borrow the same tokens.
7. **iOS.** Capacitor shell with push; then evaluate Expo for a native reader.
8. **Search.** Full-text over content with a static index at build time.
9. **Keyboard.** Panel focus, `j/k` navigation, `Esc` out of edit mode, a help overlay.
10. **Observability.** Vercel Analytics, error reporting, a health check on providers.
