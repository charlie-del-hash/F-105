import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="glow font-data text-5xl text-accent">404</div>
      <p className="mt-3 font-ui text-sm text-ink-2">No such page. Press <span className="kbd">⌘K</span> and type what you were after.</p>
      <Link href="/" className="mt-6 inline-block font-ui text-sm text-accent">← Back to the desk</Link>
    </div>
  );
}
