import { STORAGE_KEYS } from "../constants/storage.ts";
import { createEffect, createRoot } from "solid-js";
import { prefs, restorePreferences } from "../stores/preferences.ts";
import * as storage from "../utils/storage.ts";

export function load(): void {
  restorePreferences(storage.read(STORAGE_KEYS.preferences));
}

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(() => storage.write(STORAGE_KEYS.preferences, prefs));
    return dispose;
  });
}
