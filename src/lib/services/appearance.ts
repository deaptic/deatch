import type { ResolvedTheme } from "../constants/theme.ts";
import { hexToOklch, type Oklch, oklchCss } from "../utils/color.ts";

export const defaultAccentHex = "#9481ff";

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

export function applyAppearance({ theme, accent }: Appearance): void {
  const root = document.documentElement;
  root.dataset.theme = theme;

  const shades = accent ? deriveAccent(accent, theme) : null;
  setOrClear(root, "--color-accent", shades?.accent);
  setOrClear(root, "--color-accent-hover", shades?.hover);
  setOrClear(root, "--color-accent-ink", shades?.ink);
  setOrClear(root, "--color-accent-soft", shades?.soft);
}

function setOrClear(el: HTMLElement, prop: string, value?: string): void {
  if (value) el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
}
