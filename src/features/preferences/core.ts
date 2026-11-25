import { createStore } from "solid-js/store";
import { sanitize, type UserPreferences } from "./schema/index.ts";

export const [prefs, setPrefs] = createStore<UserPreferences>(sanitize({}));

let restored = false;

export const isRestored = () => restored;

export function restorePreferences(stored: unknown) {
  setPrefs(sanitize(stored));
  restored = true;
}
