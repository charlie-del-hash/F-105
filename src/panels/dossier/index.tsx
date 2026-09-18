"use client";
import Link from "next/link";
import { z } from "zod";
import { useWorkspaceData } from "@/layout-engine/data-context";
import { Empty } from "@/components/ui/Tag";
import { Kicker } from "@/components/data/Kicker";
import { panelMetaMap } from "../catalog";
import type { PanelDefinition } from "../types";

const schema = z.object({ slug: z.string().default("f-105-thunderchief") });
type Props = z.infer<typeof schema>;

const statusTone: Record<string, "up" | "warn" | "alert" | "accent"> = {
  active: "up",
  retired: "accent",
  planned: "accent",
  contested: "alert",
  watch: "warn",
};

export function SpecSheet({ specs, dense = false }: { specs: { label: string; value: string; note?: string }[]; dense?: boolean }) {
  return (
    <dl className={dense ? "text-xs" : "text-sm"}>
      {specs.map((s) => (
        <div key={s.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-line py-1.5">
          <dt className="font-ui text-ink-3">
            {s.label}
            {s.note && <span className="block text-[10.5px] text-ink-3/80">{s.note}</span>}
          </dt>
          <dd className="tabular text-right font-data text-ink">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DualUse({ civil, military }: { civil: string; military: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="border-l-2 border-series-1 bg-bg-3 px-3 py-2">
        <div className="caps text-ink-3">Civil reading</div>
        <p className="m-0 mt-1 font-ui text-[12.5px] leading-snug text-ink-2">{civil}</p>
      </div>
      <div className="border-l-2 border-accent bg-bg-3 px-3 py-2">
        <div className="caps text-ink-3">Military reading</div>
        <p className="m-0 mt-1 font-ui text-[12.5px] leading-snug text-ink-2">{military}</p>
      </div>
    </div>
  );
}

function DossierPanel({ props }: { props: Props }) {
  const { dossiers } = useWorkspaceData();
  const d = dossiers.find((x) => x.slug === props.slug);
  if (!d) return <Empty>No dossier “{props.slug}”.</Empty>;
  return (
    <div className="px-3 py-2">
      <Kicker items={[d.entity]} status={{ label: d.status, tone: statusTone[d.status] ?? "accent" }} />
      <h2 className="mt-1 font-ui text-base font-semibold leading-tight text-ink">
        <Link href={d.href}>{d.designation}</Link>
      </h2>
      <p className="mt-0.5 font-ui text-[12px] leading-snug text-ink-2">{d.dek}</p>
      <div className="mt-3">
        <SpecSheet specs={d.specs} dense />
      </div>
      {d.dualUse && (
        <div className="mt-3">
          <DualUse civil={d.dualUse.civil} military={d.dualUse.military} />
        </div>
      )}
    </div>
  );
}

export const dossierDefinition: PanelDefinition<Props> = {
  meta: panelMetaMap.get("dossier")!,
  schema,
  fields: [{ key: "slug", label: "Dossier", kind: "slug" }],
  component: DossierPanel,
  defaultTitle: (p) => `Dossier · ${p.slug}`,
  href: (p) => `/dossier/${p.slug}`,
};
