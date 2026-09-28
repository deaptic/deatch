export type Oklch = { l: number; c: number; h: number };

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToOklch(hex: string): Oklch | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
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

export function oklchToHex({ l, c, h }: Oklch): string {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;

  return "#" + [r, g, bl].map((v) => channel(toGamma(v))).join("");
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

function toGamma(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

function channel(v: number): string {
  return Math.round(v * 255).toString(16).padStart(2, "0");
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
