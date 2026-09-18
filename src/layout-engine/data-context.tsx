"use client";
/**
 * Content snapshot handed from the server workspace page to the client panels.
 * Content is static per build, so passing it down once is cheaper and simpler
 * than a content API. Rendered MDX bodies arrive as React nodes (RSC payload).
 */
import { createContext, useContext } from "react";
import type { DocSummary } from "@/content/loader";

export interface DossierData extends DocSummary {
  designation: string;
  entity: string;
  status: string;
  specs: { label: string; value: string; note?: string }[];
  dualUse?: { civil: string; military: string };
}
export interface WireData {
  id: string;
  ts: string;
  desk: string;
  text: string;
  priority: "flash" | "urgent" | "routine";
  href?: string;
  instruments: string[];
  source?: string;
}
export interface EventData {
  id: string;
  date: string;
  time?: string;
  tz: string;
  desk: string;
  title: string;
  note?: string;
  importance: "high" | "medium" | "low";
  instruments: string[];
}
export interface WorkspaceData {
  docs: DocSummary[];
  dossiers: DossierData[];
  wire: WireData[];
  events: EventData[];
  /** slug → rendered MDX body (articles and briefs). */
  bodies: Record<string, React.ReactNode>;
  /** slug → bottom line for briefs. */
  bottomLines: Record<string, string>;
}

const Ctx = createContext<WorkspaceData | null>(null);

export function WorkspaceDataProvider({ value, children }: { value: WorkspaceData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspaceData(): WorkspaceData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspaceData must be used inside WorkspaceDataProvider");
  return v;
}
