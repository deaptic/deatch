import { produce } from "solid-js/store";
import { persist, prefs, setPrefs } from "./core.ts";

export const appearanceColors = () => prefs.appearance.colors;

export function setAppearanceColor(key: string, value: string) {
  setPrefs("appearance", "colors", key, value);
  persist();
}

export function resetAppearanceColor(key: string) {
  setPrefs(
    "appearance",
    "colors",
    produce((c) => {
      delete c[key];
    }),
  );
  persist();
}

export function resetAppearanceColors() {
  setPrefs(
    "appearance",
    "colors",
    produce((c) => {
      for (const k of Object.keys(c)) delete c[k];
    }),
  );
  persist();
}
