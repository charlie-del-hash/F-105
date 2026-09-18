# Roadmap

Ordered by leverage. Each item is a session or two of agentic work with the recipes in `CLAUDE.md`.

1. ~~**Real data, one provider at a time.**~~ Done for the free sources (FRED, ECB) with a
   composite router and visible provenance — `docs/DATA.md`. Next: licensed feeds for
   energy futures (ICE/EEX), freight (Baltic via Clarksons SIN / SSY) and an AIS feed for
   the transit indicators.
2. ~~**Persistence and identity.**~~ Done: Supabase auth, `workspaces` row with RLS, sync
   with last-write-wins — `docs/PERSISTENCE.md`. Next: share a layout by link; merge
   instead of last-write-wins.
3. ~~**Alerts.**~~ Done: JSON rules, Slack / WhatsApp Business / email adapters, cron
   route with dry-run and test modes — `docs/ALERTS.md`. Next: per-user rules stored in
   Supabase, and a threshold editor in the UI.
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
