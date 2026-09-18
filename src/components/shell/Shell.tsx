"use client";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/layout-engine/store";
import type { CommandIndex } from "@/content/loader";
import { CommandBar } from "./CommandBar";
import { StatusBar } from "./StatusBar";
import { Topbar } from "./Topbar";

export function Shell({ index, children }: { index: CommandIndex; children: React.ReactNode }) {
  const [cmd, setCmd] = useState(false);
  const hydrated = useWorkspace((s) => s.hydrated);
  const theme = useWorkspace((s) => s.theme);

  // Persisted state is applied after mount so server and client markup agree.
  useEffect(() => {
    useWorkspace.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (hydrated) document.documentElement.setAttribute("data-theme", theme);
  }, [hydrated, theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((o) => !o);
      }
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setCmd(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Topbar onCommand={() => setCmd(true)} />
      <main className="flex-1">{children}</main>
      <StatusBar />
      <CommandBar open={cmd} onClose={() => setCmd(false)} index={index} />
    </>
  );
}
