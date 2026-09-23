import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost";
type Size = "xs" | "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-panel font-ui font-medium whitespace-nowrap transition-colors disabled:opacity-40 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  solid: "bg-accent text-accent-ink hover:brightness-110 active:brightness-95",
  outline: "border border-line-strong bg-bg-2 text-ink hover:border-accent hover:text-accent",
  ghost: "text-ink-2 hover:bg-bg-3 hover:text-ink",
};
const sizes: Record<Size, string> = {
  xs: "h-6 px-1.5 text-meta",
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
};

export function Button({
  variant = "outline",
  size = "sm",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...rest} />;
}

export function IconButton({
  label,
  className,
  size = "sm",
  active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: Size; active?: boolean }) {
  const dims = size === "xs" ? "h-6 w-6" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-panel text-ink-2 transition-colors hover:bg-bg-3 hover:text-ink",
        active && "bg-bg-3 text-accent",
        dims,
        className,
      )}
      {...rest}
    />
  );
}
