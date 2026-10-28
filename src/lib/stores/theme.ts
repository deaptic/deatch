import { createMemo, createRoot, createSignal } from "solid-js";
import type { ResolvedTheme } from "../constants/theme.ts";
import { appearanceTheme } from "./preferences.ts";

export const [systemPrefersDark, setSystemPrefersDark] = createSignal(false);

export const resolvedTheme: () => ResolvedTheme = createRoot(() =>
  createMemo(() => {
    const t = appearanceTheme();
    if (t !== "system") return t;
    return systemPrefersDark() ? "dark" : "light";
  }),
);
