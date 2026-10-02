import { createSignal } from "solid-js";
import type { ResolvedTheme } from "../constants/theme.ts";
import { hexToOklch, type Oklch, oklchCss } from "../utils/color.ts";

export const defaultAccentHex = "#9481ff";

const [applied, setApplied] = createSignal(0);
const tokens = new Map<string, string>();

const DEFAULT_ACCENT: Oklch = hexToOklch(defaultAccentHex)!;

type AccentShades = {
  accent: string;
  hover: string;
  ink: string;
  soft: string;
};

const SHADES: Record<ResolvedTheme, (base: Oklch) => AccentShades> = {
  dark: (b) => ({
    accent: oklchCss({ ...b, l: 0.58 }),
    hover: oklchCss({ ...b, l: 0.64 }),
    ink: oklchCss({ l: 0.82, c: Math.min(b.c, 0.13), h: b.h }),
    soft: oklchCss({ ...b, l: 0.58 }, 0.14),
  }),
  light: (b) => ({
    accent: oklchCss({ ...b, l: 0.54 }),
    hover: oklchCss({ ...b, l: 0.48 }),
    ink: oklchCss({ ...b, l: 0.46 }),
    soft: oklchCss({ ...b, l: 0.54 }, 0.12),
  }),
};

export function deriveAccent(hex: string, theme: ResolvedTheme): AccentShades {
  const parsed = hexToOklch(hex) ?? DEFAULT_ACCENT;
  return SHADES[theme]({ ...parsed, c: Math.min(parsed.c, 0.2) });
}

type Appearance = {
  theme: ResolvedTheme;
  accent: string | null;
};

export function apply({ theme, accent }: Appearance): void {
  const root = document.documentElement;
  root.dataset.theme = theme;

  const shades = accent ? deriveAccent(accent, theme) : null;
  setOrClear(root, "--color-accent", shades?.accent);
  setOrClear(root, "--color-accent-hover", shades?.hover);
  setOrClear(root, "--color-accent-ink", shades?.ink);
  setOrClear(root, "--color-accent-soft", shades?.soft);
  tokens.clear();
  setApplied((n) => n + 1);
}

const TILE_SCALE = 2.5;

type FeedSizing = { fontSize: number; groupSpacing: number };

export function applyFeedSizing({ fontSize, groupSpacing }: FeedSizing): void {
  const style = document.documentElement.style;
  style.setProperty("--chat-size", `${fontSize}px`);
  style.setProperty("--chat-tile", `${fontSize * TILE_SCALE}px`);
  style.setProperty("--chat-two-lines", "2lh");
  style.setProperty("--feed-group-gap", `${groupSpacing}px`);
}

export function token(name: string): string {
  applied();
  let value = tokens.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${name}`)
      .trim();
    tokens.set(name, value);
  }
  return value;
}

function setOrClear(el: HTMLElement, prop: string, value?: string): void {
  if (value) el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
}
