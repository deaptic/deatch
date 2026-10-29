import { feedUserOverrideNameColor } from "../../lib/stores/preferences.ts";
import { resolvedTheme } from "../../lib/stores/theme.ts";
import { readableColor } from "../../lib/utils/color.ts";

export function nameColor(color: string | undefined): string {
  const override = feedUserOverrideNameColor();
  if (override) return override;
  return color
    ? readableColor(color, resolvedTheme())
    : "var(--color-ink-soft)";
}
