export function Timeline({ title, items }: { title: string; items: { date: string; title: string; text?: string; key?: boolean }[] }) {
  return (
    <section className="my-8">
      <h2 className="caps mb-4 text-ink-3">{title}</h2>
      <ol className="relative ml-2 border-l border-line pl-5">
        {items.map((it, i) => (
          <li key={i} className="relative mb-5">
            <span
              className="absolute -left-[26px] top-1.5 block h-2.5 w-2.5 rounded-full border border-line-strong"
              style={{ background: it.key ? "var(--accent)" : "var(--bg-2)" }}
              aria-hidden
            />
            <div className="font-data text-xs text-ink-3">{it.date}</div>
            <div className="font-ui text-sm font-medium text-ink">{it.title}</div>
            {it.text && <p className="m-0 mt-0.5 font-ui text-sm text-ink-2">{it.text}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
