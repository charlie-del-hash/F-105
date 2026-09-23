"use client";
/**
 * Client-side panel registry: type → definition (schema + component + settings fields).
 * The server-safe metadata lives in catalog.ts. Keep both in sync —
 * scripts/check-panels.ts (in `pnpm check`) fails the build if they drift.
 */
import type { PanelDefinition } from "./types";
import { wireDefinition } from "./wire";
import { quotesDefinition } from "./quotes";
import { chartDefinition } from "./chart";
import { compareDefinition } from "./compare";
import { headlinesDefinition } from "./headlines";
import { readerDefinition } from "./reader";
import { dossierDefinition } from "./dossier";
import { plotDefinition } from "./plot";
import { calendarDefinition } from "./calendar";
import { clocksDefinition } from "./clocks";
import { notesDefinition } from "./notes";
import { indicatorsDefinition } from "./indicators";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defs: PanelDefinition<any>[] = [
  wireDefinition,
  quotesDefinition,
  chartDefinition,
  compareDefinition,
  headlinesDefinition,
  readerDefinition,
  dossierDefinition,
  plotDefinition,
  calendarDefinition,
  clocksDefinition,
  notesDefinition,
  indicatorsDefinition,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const panelRegistry = new Map<string, PanelDefinition<any>>(defs.map((d) => [d.meta.type, d]));

export function getPanelDefinition(type: string) {
  return panelRegistry.get(type);
}
