import { createStore, unwrap } from "solid-js/store";
import { sanitize, type UserPreferences } from "./schema.ts";

export * from "./schema.ts";

function load(): UserPreferences {
  try {
    const raw = localStorage.getItem("user_preferences");
    return sanitize(raw ? JSON.parse(raw) : {});
  } catch {
    return sanitize({});
  }
}

export const [prefs, setPrefs] = createStore<UserPreferences>(load());

export function persist() {
  localStorage.setItem("user_preferences", JSON.stringify(unwrap(prefs)));
}
