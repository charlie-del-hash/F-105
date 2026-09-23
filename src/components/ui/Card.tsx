import { cn } from "@/lib/cn";

/**
 * Panel chrome, in one place.
 *
 * The dashboard's `PanelFrame` and every panel-shaped block on a static page —
 * the market boards, a desk's instruments, the reading-page aside, the kit —
 * used to hand-roll the same `bezel` + `caps border-b border-line` header. Ten
 * copies meant `--fx-headfill` and the mnemonic slug reached the dashboard and
 * nowhere else, so on Paper the desk went boxless while `/markets` kept its
 * boxes.
 */
export function CardHead({
  slug,
  title,
  titleAttr,
  hint,
  leading,
  actions,
  className,
  ...rest
}: {
  /** Short command token shown before the title, e.g. a panel's mnemonic. */
  slug?: string;
  title: React.ReactNode;
  /** `title` attribute for the heading, when the visible text may truncate. */
  titleAttr?: string;
  /** Tooltip for the header itself — what interacting with it does. */
  hint?: string;
  /** Anything before the slug — the drag grip, in edit mode. */
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  return (
    <header
      className={cn(
        "panel-head flex h-[30px] shrink-0 items-center gap-1 border-b border-line px-2.5 select-none",
        className,
      )}
      title={hint}
      {...rest}
    >
      {leading}
      {slug && (
        <>
          <span className="shrink-0 font-data text-xs uppercase tracking-[0.12em] text-ink-3" aria-hidden>
            {slug}
          </span>
          <span className="h-3 w-px shrink-0 bg-line" aria-hidden />
        </>
      )}
      <h3 className="caps min-w-0 flex-1 truncate text-ink-2" title={titleAttr}>
        {title}
      </h3>
      {actions}
    </header>
  );
}

/**
 * A static panel: the bezel, the header, and a body that fills what is left.
 * Give the card a height and the body gets it — no `calc(100% - 2rem)` tied to
 * a header height that changes with the theme's density.
 */
export function Card({
  slug,
  title,
  actions,
  className,
  bodyClassName,
  children,
}: {
  slug?: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("bezel flex min-h-0 min-w-0 flex-col overflow-hidden", className)}>
      <CardHead slug={slug} title={title} actions={actions} />
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
