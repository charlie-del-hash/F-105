import type { Metadata } from "next";
import { getContent, summarize } from "@/content/loader";
import { renderMdx } from "@/content/mdx";
import { Workspace } from "@/layout-engine/Workspace";
import type { WorkspaceData } from "@/layout-engine/data-context";

export const metadata: Metadata = { title: "Desk" };

export default async function DeskPage() {
  const c = await getContent();
  const all = [...c.articles, ...c.briefs, ...c.dossiers].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const data: WorkspaceData = {
    docs: all.map(summarize),
    dossiers: c.dossiers.map((d) => ({
      ...summarize(d),
      designation: d.data.designation,
      entity: d.data.entity,
      status: d.data.status,
      specs: d.data.specs,
      dualUse: d.data.dualUse,
    })),
    wire: c.wire.map((w) => ({ ...w, ts: w.ts.toISOString() })),
    events: c.events.map((e) => ({ ...e, date: e.date.toISOString() })),
    bodies: Object.fromEntries([...c.articles, ...c.briefs].map((d) => [d.slug, renderMdx(d.body)])),
    bottomLines: Object.fromEntries(c.briefs.map((b) => [b.slug, b.data.bottomLine])),
  };
  return <Workspace data={data} />;
}
