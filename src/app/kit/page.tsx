import type { Metadata } from "next";
import { themes } from "@/design/tokens";
import { Button, IconButton } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Field, Input, Select } from "@/components/ui/Field";
import { ChartBlock } from "@/panels/chart";
import { QuoteTable } from "@/panels/quotes";
import { StatTiles } from "@/panels/indicators";
import { PlotView } from "@/panels/plot";
import { Clocks } from "@/panels/clocks";
import { Factbox, PullQuote, Callout, Figure } from "@/content/mdx";
import { Share2 } from "lucide-react";

export const metadata: Metadata = { title: "Kit" };

const roles = ["bg", "bg-2", "bg-3", "line", "line-strong", "ink", "ink-2", "ink-3", "accent", "up", "down", "warn", "alert"];

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="caps text-ink-3">{title}</h2>
        {note && <span className="font-ui text-xs text-ink-3">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export default function KitPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <h1 className="caps mb-1 text-ink-3">Kit</h1>
      <p className="mb-8 max-w-2xl font-ui text-sm text-ink-2">Every primitive, in the current theme. Switch themes in the top bar and everything on this page re-skins from tokens alone. If a component needs a colour that is not here, the token is missing, not the component.</p>

      <Section title="Themes" note="src/design/tokens.json">
        <ul className="grid gap-2 sm:grid-cols-3">
          {themes.map((t) => (
            <li key={t.id} className="bezel flex items-center gap-3 p-3">
              <span className="h-8 w-8 rounded-[var(--radius)] border border-line" style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }} aria-hidden />
              <span>
                <span className="block font-ui text-sm font-medium text-ink">{t.name} <span className="text-ink-3">· {t.scheme}</span></span>
                <span className="block font-ui text-xs text-ink-2">{t.tagline}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Colour roles" note="never hard-code a hex in a component">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {roles.map((r) => (
            <li key={r} className="bezel p-2">
              <div className="h-8 rounded-[var(--radius)] border border-line" style={{ background: `var(--${r})` }} />
              <div className="mt-1 font-data text-[10.5px] text-ink-2">--{r}</div>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <span key={i} className="h-5 flex-1 rounded-[var(--radius)]" style={{ background: `var(--series-${i})` }} title={`--series-${i}`} />
          ))}
        </div>
        <p className="mt-1 font-ui text-[11px] text-ink-3">Series palette, in fixed order. Assign by entity, never by rank; never cycle past eight.</p>
      </Section>

      <Section title="Type" note="ui · data · read">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bezel p-4"><div className="caps text-ink-3">font-ui</div><p className="mt-2 font-ui text-lg text-ink">The quick brown fox jumps over the lazy dog.</p><p className="font-ui text-sm text-ink-2">Interface, headings, labels.</p></div>
          <div className="bezel p-4"><div className="caps text-ink-3">font-data</div><p className="tabular mt-2 font-data text-lg text-ink">74.21 ▲ +0.48 (+0.65%)</p><p className="font-ui text-sm text-ink-2">Numbers, tables, symbols. Tabular in columns.</p></div>
          <div className="bezel p-4"><div className="caps text-ink-3">font-read</div><p className="mt-2 font-read text-lg text-ink">Armies move by sea. Not the sharp end — the sharp end flies.</p><p className="font-ui text-sm text-ink-2">Long-form reading.</p></div>
        </div>
      </Section>

      <Section title="Controls">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="solid">Solid</Button>
          <Button>Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="xs">Extra small</Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Share"><Share2 size={15} /></IconButton>
          <span className="kbd">⌘K</span>
          <Tag>neutral</Tag><Tag tone="accent">accent</Tag><Tag tone="up">up</Tag><Tag tone="down">down</Tag><Tag tone="warn">warn</Tag><Tag tone="alert">alert</Tag>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 font-ui text-xs text-ink-2">
          <span><span className="led" /> off</span>
          <span><span className="led led-ok" /> ok</span>
          <span><span className="led led-live" /> live</span>
          <span><span className="led led-warn" /> warn</span>
          <span><span className="led led-alert" /> alert</span>
        </div>
        <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2">
          <Field label="Text"><Input placeholder="Type…" defaultValue="" /></Field>
          <Field label="Select" hint="Native, themed"><Select defaultValue="a"><option value="a">Option A</option><option value="b">Option B</option></Select></Field>
        </div>
      </Section>

      <Section title="Surfaces" note="bezel · inset · glow">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="bezel p-4 font-ui text-sm text-ink-2">.bezel — a panel. Hairline, inner highlight, soft drop. Turned off by Paper.</div>
          <div className="inset p-4 font-ui text-sm text-ink-2">.inset — a screen area inside a panel.</div>
          <div className="bezel p-4"><span className="glow font-data text-2xl text-accent">GLOW</span><div className="font-ui text-sm text-ink-2">.glow — phosphor bloom on brand text.</div></div>
        </div>
      </Section>

      <Section title="Data blocks" note="live from /api">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="bezel h-72 overflow-hidden"><div className="caps border-b border-line px-3 py-1.5 text-ink-3">Chart</div><div className="h-[calc(100%-2rem)]"><ChartBlock symbol="TTF" /></div></div>
          <div className="bezel h-72 overflow-auto"><div className="caps border-b border-line px-3 py-1.5 text-ink-3">Quote board</div><QuoteTable symbols={["BRENT", "TTF", "JKM", "TD3C", "BDI"]} /></div>
          <div className="bezel h-40 overflow-hidden"><div className="caps border-b border-line px-3 py-1.5 text-ink-3">Stat tiles</div><div className="h-[calc(100%-2rem)]"><StatTiles symbols={["HORMUZ.TX", "BAB.TX", "WAR.RS"]} /></div></div>
          <div className="bezel h-40 overflow-hidden"><div className="caps border-b border-line px-3 py-1.5 text-ink-3">World clocks</div><div className="h-[calc(100%-2rem)]"><Clocks names={["London", "Dubai", "Singapore", "New York"]} /></div></div>
          <div className="bezel h-96 overflow-hidden lg:col-span-2"><div className="caps border-b border-line px-3 py-1.5 text-ink-3">Plot</div><div className="h-[calc(100%-2rem)]"><PlotView areaId="hormuz" /></div></div>
        </div>
      </Section>

      <Section
        title="Theme contact sheet"
        note="the same three blocks in all six themes — compare, do not take on trust"
      >
        <p className="mb-3 max-w-2xl font-ui text-xs text-ink-3">
          Each tile below is scoped with its own <code className="font-data">data-theme</code>, so the
          tokens, the chrome dials and the series palette are exactly what that theme ships. Two
          things do not survive the nesting and have to be judged on the real page:{" "}
          <code className="font-data">--density</code> (rem resolves against the document root, not
          the nearest ancestor) and the CRT scanline and vignette overlays, which are fixed to the
          viewport.
        </p>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {themes.map((t) => (
            <div key={t.id} data-theme={t.id} className="bezel overflow-hidden bg-bg p-2">
              <div className="mb-2 flex items-baseline gap-2 px-1">
                <span className="font-ui text-sm font-medium text-ink">{t.name}</span>
                <span className="font-data text-[10px] uppercase tracking-wider text-ink-3">{t.scheme}</span>
                <span className="ml-auto flex gap-0.5" aria-hidden>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-[1px]" style={{ background: `var(--series-${i})` }} />
                  ))}
                </span>
              </div>
              <div className="bezel mb-2 h-60 overflow-hidden">
                <div className="panel-head caps flex items-center gap-1 border-b border-line px-2 py-1 text-ink-2">
                  <span className="font-data text-[10px] tracking-[0.12em] text-ink-3">GP</span>
                  <span className="h-3 w-px bg-line" />
                  <span>Brent</span>
                </div>
                <div className="h-[calc(100%-1.75rem)]">
                  <ChartBlock symbol="BRENT" />
                </div>
              </div>
              <div className="bezel overflow-hidden">
                <div className="panel-head caps flex items-center gap-1 border-b border-line px-2 py-1 text-ink-2">
                  <span className="font-data text-[10px] tracking-[0.12em] text-ink-3">QB</span>
                  <span className="h-3 w-px bg-line" />
                  <span>Quote board</span>
                </div>
                <QuoteTable symbols={["BRENT", "TTF", "TD3C"]} compact />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="In-article kit" note="src/content/mdx.tsx">
        <div className="prose-read">
          <Factbox rows={[["Label", "Value"], ["Another", "12.5 kn"]]} />
          <p>Body copy in the reading face. The factbox floats right on wide screens and stacks on phones.</p>
          <PullQuote cite="Attribution">A pull quote, set large, with a rule above and below.</PullQuote>
          <Callout tone="warn" title="Callout">Warn, alert, accent or neutral. Used for demo-content notices.</Callout>
          <Figure alt="Hatched placeholder until real photography exists" caption="A figure with a caption." credit="Credit line" ratio="wide" />
        </div>
      </Section>
    </div>
  );
}
