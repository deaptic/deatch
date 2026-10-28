import type { ResolvedTheme } from "../constants/theme.ts";
import { at } from "./at.ts";

export type Oklch = { l: number; c: number; h: number };

// Twitch colours are chosen for one background; clamp lightness so dark
// colours stay readable on dark and light colours on light.
export function readableColor(color: string, theme: ResolvedTheme): string {
  return theme === "dark"
    ? `oklch(from ${color} max(l, 0.64) c h)`
    : `oklch(from ${color} min(l, 0.58) c h)`;
}

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToOklch(hex: string): Oklch | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(at(m, 1), 16);
  const r = toLinear(((n >> 16) & 255) / 255);
  const g = toLinear(((n >> 8) & 255) / 255);
  const b = toLinear((n & 255) / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m_ - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m_ + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m_ - 0.808675766 * s;

  const c = Math.hypot(a, bb);
  const h = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

const MIN_HUED_CHROMA = 0.03;

export function hueOf(hex: string): number | undefined {
  const c = hexToOklch(hex);
  return c && c.c >= MIN_HUED_CHROMA ? c.h : undefined;
}

export function oklchCss({ l, c, h }: Oklch, alpha?: number): string {
  const base = `${round(l)} ${round(c)} ${round(h)}`;
  return alpha === undefined
    ? `oklch(${base})`
    : `oklch(${base} / ${round(alpha)})`;
}

function toLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
