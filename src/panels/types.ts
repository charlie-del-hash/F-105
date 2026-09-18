import type { ComponentType } from "react";
import type { z } from "zod";
import type { PanelMeta } from "./catalog";

/** Props every panel component receives. `props` is already validated against the panel's schema. */
export interface PanelComponentProps<P> {
  panelId: string;
  props: P;
  /** Grid size, so a panel can adapt (a 2-row clock strip vs a 6-row one). */
  size: { w: number; h: number };
  edit: boolean;
}

/** Declarative settings form. The frame renders it; the panel never writes its own settings UI. */
export type Field =
  | { key: string; label: string; kind: "text" | "number"; hint?: string }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[]; hint?: string }
  | { key: string; label: string; kind: "symbols" | "desk" | "slug" | "zones" | "boolean"; hint?: string };

export interface PanelDefinition<P = unknown> {
  meta: PanelMeta;
  schema: z.ZodType<P>;
  fields: Field[];
  component: ComponentType<PanelComponentProps<P>>;
  defaultTitle: (props: P) => string;
  /** Optional deep link shown as the "open" action. */
  href?: (props: P) => string | undefined;
}
