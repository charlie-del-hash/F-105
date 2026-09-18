/**
 * MDX rendering (server). The component map is the "in-article kit":
 * <Factbox>, <PullQuote>, <Callout>, <Figure>, <Dinkus>, <Spec>.
 * Keep these server-safe (no hooks). Anything interactive goes in a client
 * component that these can import.
 */
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Factbox({ title = "At a glance", rows }: { title?: string; rows: [string, string][] }) {
  return (
    <aside className="bezel my-6 p-3 font-ui text-sm md:float-right md:ml-6 md:w-64">
      <div className="caps mb-2 text-ink-3">{title}</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-data text-xs text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export function PullQuote({ children, cite }: { children: React.ReactNode; cite?: string }) {
  return (
    <blockquote className="my-8 border-l-0 border-y border-line py-4 pl-0 font-read text-xl italic leading-snug text-ink">
      {children}
      {cite && <footer className="caps mt-2 not-italic text-ink-3">— {cite}</footer>}
    </blockquote>
  );
}

export function Callout({ tone = "neutral", title, children }: { tone?: "neutral" | "warn" | "alert" | "accent"; title?: string; children: React.ReactNode }) {
  const tones = { neutral: "border-line-strong", warn: "border-warn", alert: "border-alert", accent: "border-accent" };
  return (
    <div className={cn("my-6 border-l-2 bg-bg-3 px-4 py-3 font-ui text-sm", tones[tone])}>
      {title && <div className="caps mb-1 text-ink-3">{title}</div>}
      <div className="[&>p]:m-0">{children}</div>
    </div>
  );
}

/** Image placeholder with a hatched fill until real photography exists. */
export function Figure({ src, alt = "", caption, credit, ratio = "wide" }: { src?: string; alt?: string; caption?: string; credit?: string; ratio?: "wide" | "43" | "square" }) {
  const ar = ratio === "wide" ? "16/9" : ratio === "43" ? "4/3" : "1/1";
  return (
    <figure className="my-6">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full rounded-[var(--radius)] border border-line" style={{ aspectRatio: ar, objectFit: "cover" }} />
      ) : (
        <div
          role="img"
          aria-label={alt || "Placeholder image"}
          className="flex w-full items-end justify-start rounded-[var(--radius)] border border-line p-2"
          style={{
            aspectRatio: ar,
            background: "repeating-linear-gradient(135deg, var(--bg-3) 0 6px, var(--bg-2) 6px 12px)",
          }}
        >
          <span className="caps bg-bg-2 px-1.5 py-0.5 text-ink-3">{alt || "image placeholder"}</span>
        </div>
      )}
      {(caption || credit) && (
        <figcaption className="mt-2 font-ui text-xs text-ink-2">
          {caption} {credit && <span className="text-ink-3">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}

export function Dinkus() {
  return <div className="my-8 text-center font-data text-ink-3" aria-hidden>* * *</div>;
}

/** Inline instrument reference → the chart page. */
export function Sym({ s }: { s: string }) {
  return (
    <Link href={`/markets/${s}`} className="rounded-[3px] bg-bg-3 px-1 font-data text-[0.85em] text-accent no-underline">
      {s}
    </Link>
  );
}

export const mdxComponents = {
  Factbox,
  PullQuote,
  Callout,
  Figure,
  Dinkus,
  Sym,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? "#";
    return href.startsWith("/") ? <Link href={href}>{props.children}</Link> : <a {...props} target="_blank" rel="noreferrer" />;
  },
};

/**
 * Content is in-repo and trusted, so JSX expressions (e.g. `rows={[...]}`) are enabled.
 * `blockDangerousJS` stays on: no eval/process/require inside MDX.
 */
export function renderMdx(source: string) {
  return <MDXRemote source={source} components={mdxComponents} options={{ blockJS: false, blockDangerousJS: true }} />;
}
