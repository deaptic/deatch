import { createStore } from "solid-js/store";
import { sanitize, type UserPreferences } from "./schema.ts";

export * from "./schema.ts";

/// Defaults until the preferences service restores what was saved.
export const [prefs, setPrefs] = createStore<UserPreferences>(sanitize({}));

export function restorePreferences(stored: unknown) {
  setPrefs(sanitize(stored));
}
