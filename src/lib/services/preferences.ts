import { createEffect, createRoot } from "solid-js";
import { prefs, restorePreferences } from "../stores/preferences.ts";
import * as storage from "../utils/storage.ts";

const STORAGE_KEY = "user_preferences";

/// Runs before the first render, so the app opens with the saved look.
export function load(): void {
  restorePreferences(storage.read(STORAGE_KEY));
}

/// Saves every change; serializing reads, and so tracks, every preference.
export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(() => storage.write(STORAGE_KEY, prefs));
    return dispose;
  });
}
