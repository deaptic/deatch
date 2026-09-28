import { createMemo, createRoot, createSignal } from "solid-js";
import type { ResolvedTheme } from "../services/appearance.ts";
import { appearanceTheme } from "./preferences.ts";

const query = window.matchMedia("(prefers-color-scheme: dark)");
const [systemPrefersDark, setSystemPrefersDark] = createSignal(query.matches);
query.addEventListener("change", (e) => setSystemPrefersDark(e.matches));

export const resolvedTheme: () => ResolvedTheme = createRoot(() =>
  createMemo(() => {
    const t = appearanceTheme();
    if (t !== "system") return t;
    return systemPrefersDark() ? "dark" : "light";
  })
);
