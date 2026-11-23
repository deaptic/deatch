import { createSignal } from "solid-js";
import type { ResolvedTheme } from "../constants/theme.ts";
import { appearanceTheme } from "../../features/preferences/index.ts";

export const [systemPrefersDark, setSystemPrefersDark] = createSignal(false);

export function resolvedTheme(): ResolvedTheme {
  const t = appearanceTheme();
  if (t !== "system") return t;
  return systemPrefersDark() ? "dark" : "light";
}
