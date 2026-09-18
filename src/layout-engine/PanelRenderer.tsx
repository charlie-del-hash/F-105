"use client";
import { Component, type ReactNode } from "react";
import { getPanelDefinition } from "@/panels/registry";
import { Empty } from "@/components/ui/Tag";
import type { PanelInstance } from "./schema";

class PanelErrorBoundary extends Component<{ children: ReactNode; label: string }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <Empty>
          <div>
            <div className="caps text-alert">Panel failed</div>
            <div className="mt-1 font-data text-[11px]">{this.state.error.message}</div>
          </div>
        </Empty>
      );
    }
    return this.props.children;
  }
}

export function PanelRenderer({ panel, edit }: { panel: PanelInstance; edit: boolean }) {
  const def = getPanelDefinition(panel.type);
  if (!def) return <Empty>Unknown panel type “{panel.type}”.</Empty>;
  const parsed = def.schema.safeParse(panel.props);
  if (!parsed.success) {
    return (
      <Empty>
        <div>
          <div className="caps text-warn">Bad settings</div>
          <div className="mt-1 font-data text-[11px]">{parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}</div>
        </div>
      </Empty>
    );
  }
  const Cmp = def.component;
  return (
    <PanelErrorBoundary label={panel.type}>
      <Cmp panelId={panel.id} props={parsed.data} size={{ w: panel.w, h: panel.h }} edit={edit} />
    </PanelErrorBoundary>
  );
}

/** Resolve a panel's display title: explicit override, else the definition's default. */
export function panelTitle(panel: PanelInstance) {
  if (panel.title) return panel.title;
  const def = getPanelDefinition(panel.type);
  if (!def) return panel.type;
  const parsed = def.schema.safeParse(panel.props);
  return parsed.success ? def.defaultTitle(parsed.data) : def.meta.name;
}

export function panelHref(panel: PanelInstance) {
  const def = getPanelDefinition(panel.type);
  if (!def?.href) return undefined;
  const parsed = def.schema.safeParse(panel.props);
  return parsed.success ? def.href(parsed.data) : undefined;
}
