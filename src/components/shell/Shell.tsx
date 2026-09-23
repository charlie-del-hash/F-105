"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTO, THEME_STORAGE_KEY, resolveTheme, themeIds, type ThemeChoice } from "@/design/tokens";
import { presetLayouts } from "@/layout-engine/presets";
import { useActiveLayout, useWorkspace } from "@/layout-engine/store";
import { WorkspaceSync } from "@/layout-engine/sync";
import { DialogHost, useDialogs } from "@/components/ui/dialogs";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThemeOverride } from "@/lib/useThemeOverride";
import type { CommandIndex } from "@/content/loader";
import { CommandBar } from "./CommandBar";
import { KeyboardHelp } from "./KeyboardHelp";
import { BottomBar } from "./BottomBar";
import { StatusBar } from "./StatusBar";
import { Topbar } from "./Topbar";

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export function Shell({ index, children }: { index: CommandIndex; children: React.ReactNode }) {
  const [cmd, setCmd] = useState(false);
  const [help, setHelp] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useWorkspace((s) => s.hydrated);
  const choice = useWorkspace((s) => s.theme);
  const pinned = useWorkspace((s) => s.themePinned);
  const override = useThemeOverride((s) => s.overrideTheme);
  const layout = useActiveLayout();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  /**
   * The one place a theme is decided, in precedence order:
   *   1. an in-page override — the reading surface's Paper toggle, ephemeral
   *   2. the user's pick, once they have made one
   *   3. the active layout's declared theme — Pocket asks for Glass, Bridge for
   *      Bridge. This field has been in the layout schema all along and nothing
   *      ever read it.
   *   4. the pick as a fallback, which unpinned means Auto → the OS scheme
   * Only 2 and 4 are persisted, so an unpinned device derives its own theme from
   * whatever layout it is showing and never pushes that to another device.
   */
  const theme = override ?? (pinned ? resolveTheme(choice, prefersDark) : layout.theme ?? resolveTheme(choice, prefersDark));

  // Persisted state is applied after mount so server and client markup agree.
  useEffect(() => {
    useWorkspace.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", theme);
    // The boot script reads this back before first paint on the next visit, so it
    // holds the resolved theme rather than the choice.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
    // iOS status bar and the browser chrome follow the theme's background.
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    if (bg) meta.content = bg;
  }, [hydrated, theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHelp(false);
        setCmd((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (useDialogs.getState().current) return;
      const s = useWorkspace.getState();
      switch (e.key) {
        case "/":
          e.preventDefault();
          setHelp(false);
          setCmd(true);
          break;
        case "?":
          e.preventDefault();
          setCmd(false);
          setHelp((o) => !o);
          break;
        case "Escape":
          if (s.editMode) s.setEditMode(false);
          break;
        case "e":
        case "E":
          if (pathname !== "/") router.push("/");
          s.setEditMode(!s.editMode);
          break;
        case "t":
        case "T": {
          // Auto sits at the head of the cycle, as it does in the picker.
          const cycle: ThemeChoice[] = [AUTO, ...themeIds];
          const i = cycle.indexOf(s.theme);
          s.setTheme(cycle[(i + 1) % cycle.length]);
          break;
        }
        case "[":
        case "]": {
          const all = [...presetLayouts.map((l) => l.id), ...s.layouts.map((l) => l.id)];
          const i = Math.max(0, all.indexOf(s.activeId));
          const next = all[(i + (e.key === "]" ? 1 : all.length - 1)) % all.length];
          s.setActive(next);
          if (pathname !== "/") router.push("/");
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return (
    <>
      <WorkspaceSync />
      <Topbar onCommand={() => setCmd(true)} />
      <main className="flex-1">{children}</main>
      <StatusBar onHelp={() => setHelp(true)} />
      {/* Phone navigation sits in the thumb zone; the page ends above it. */}
      <div className="pad-bottom-bar md:hidden" aria-hidden />
      <BottomBar />
      <CommandBar open={cmd} onClose={() => setCmd(false)} index={index} />
      <KeyboardHelp open={help} onClose={() => setHelp(false)} />
      <DialogHost />
    </>
  );
}
