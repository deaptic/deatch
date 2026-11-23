import { STORAGE_KEYS } from "../constants/storage.ts";
import { createEffect, createRoot } from "solid-js";
import { prefs, restorePreferences } from "../stores/preferences.ts";
import * as storage from "../utils/storage.ts";
import { setLocale } from "../../shared/i18n/index.ts";

export function load(): void {
  restorePreferences(storage.read(STORAGE_KEYS.preferences));
  setLocale(prefs.appearance.language);
}

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(() => storage.write(STORAGE_KEYS.preferences, prefs));
    createEffect(() => setLocale(prefs.appearance.language));
    return dispose;
  });
}
