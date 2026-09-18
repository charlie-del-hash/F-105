/**
 * Typed access to the design tokens. The JSON is the source of truth
 * (also consumed by scripts/tokens-to-css.mjs and, later, the iOS build).
 */
import tokens from "./tokens.json";

export type ThemeId = keyof typeof tokens.themes;
export const themeIds = Object.keys(tokens.themes) as ThemeId[];
export const defaultTheme = tokens.defaultTheme as ThemeId;

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  scheme: "light" | "dark";
  accent: string;
  bg: string;
  ink: string;
}

export const themes: ThemeMeta[] = themeIds.map((id) => {
  const t = tokens.themes[id];
  return {
    id,
    name: t.name,
    tagline: t.tagline,
    scheme: t.scheme as "light" | "dark",
    accent: t.color.accent,
    bg: t.color.bg,
    ink: t.color.ink,
  };
});

export function isThemeId(x: unknown): x is ThemeId {
  return typeof x === "string" && (themeIds as string[]).includes(x);
}

/** Categorical series palette for the given scheme (dataviz-validated order; never cycle past 8). */
export function seriesPalette(scheme: "light" | "dark") {
  return tokens.series[scheme];
}

export const THEME_STORAGE_KEY = "f105.theme";
