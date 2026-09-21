"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { themeIds } from "@/design/tokens";
import { presetLayouts } from "@/layout-engine/presets";
import { useWorkspace } from "@/layout-engine/store";
import { WorkspaceSync } from "@/layout-engine/sync";
import { DialogHost, useDialogs } from "@/components/ui/dialogs";
import type { CommandIndex } from "@/content/loader";
import { CommandBar } from "./CommandBar";
import { KeyboardHelp } from "./KeyboardHelp";
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
  const theme = useWorkspace((s) => s.theme);

  // Persisted state is applied after mount so server and client markup agree.
  useEffect(() => {
    useWorkspace.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", theme);
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
          const i = themeIds.indexOf(s.theme);
          s.setTheme(themeIds[(i + 1) % themeIds.length]);
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
      <CommandBar open={cmd} onClose={() => setCmd(false)} index={index} />
      <KeyboardHelp open={help} onClose={() => setHelp(false)} />
      <DialogHost />
    </>
  );
}
