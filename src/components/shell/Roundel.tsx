/** The wordmark's glyph: a scope with one sweep. Inherits currentColor. */
export function Roundel({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <path d="M8 8 L8 1.5 A6.5 6.5 0 0 1 13.6 4.7 Z" fill="currentColor" fillOpacity="0.9" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
