import { feedUserOverrideNameColor } from "../preferences/index.ts";
import { resolvedTheme } from "../appearance/index.ts";
import { readableColor } from "../../shared/color.ts";

export function nameColor(color: string | undefined): string {
  const override = feedUserOverrideNameColor();
  if (override) return override;
  return color
    ? readableColor(color, resolvedTheme())
    : "var(--color-ink-soft)";
}
