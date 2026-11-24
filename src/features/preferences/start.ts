import {
  preferencesBackupKey,
  preferencesKey,
  preferencesSectionOf,
  STORAGE_KEYS,
  type StorageKey,
} from "../../platform/storageKeys.ts";
import { createEffect, createRoot } from "solid-js";
import { prefs, restorePreferences } from "./core.ts";
import {
  changesFrom,
  DEFAULT_PREFERENCES,
  migrate,
  PREFERENCES_SECTIONS,
  PREFERENCES_VERSION,
  type PreferencesSection,
} from "./schema/index.ts";
import * as storage from "../../platform/storage.ts";
import { setLocale } from "../../shared/i18n/index.ts";
import { setClock } from "../../shared/time.ts";
import { fromKeys } from "../../shared/fromKeys.ts";

function readKept(key: StorageKey, name: string): unknown {
  const text = storage.readText(key);
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn(`preferences: ${name} unreadable, kept a copy`, e);
    storage.writeText(preferencesBackupKey(name), text);
    return undefined;
  }
}

const readSection = (section: string) =>
  readKept(preferencesKey(section), section);

const storedSections = () =>
  storage.keys().flatMap((key) => preferencesSectionOf(key) ?? []);

const isRetired = (key: string) => {
  const section = preferencesSectionOf(key);
  return (
    section !== null &&
    !PREFERENCES_SECTIONS.some((current) => current === section)
  );
};

function readStored(): { sections: Record<string, unknown>; version: number } {
  const version = storage.read(STORAGE_KEYS.preferencesVersion);
  if (typeof version === "number") {
    return { sections: fromKeys(storedSections(), readSection), version };
  }
  const legacy = readKept(STORAGE_KEYS.legacyPreferences, "all");
  return {
    sections: legacy && typeof legacy === "object" ? { ...legacy } : {},
    version: 0,
  };
}

function saveSection(section: PreferencesSection): void {
  storage.write(
    preferencesKey(section),
    changesFrom(prefs[section], DEFAULT_PREFERENCES[section]) ?? {},
  );
}

function save(): void {
  for (const section of PREFERENCES_SECTIONS) saveSection(section);
  storage.write(STORAGE_KEYS.preferencesVersion, PREFERENCES_VERSION);
}

export function load(): void {
  const stored = readStored();
  restorePreferences(migrate(stored.sections, stored.version));
  if (stored.version < PREFERENCES_VERSION) {
    save();
    storage.removeWhere(
      (key) => key === STORAGE_KEYS.legacyPreferences || isRetired(key),
    );
  }
  setLocale(prefs.language.app);
  setClock(prefs.language.clock);
}

export function start(): () => void {
  return createRoot((dispose) => {
    for (const section of PREFERENCES_SECTIONS) {
      createEffect(() => saveSection(section));
    }
    createEffect(() => setLocale(prefs.language.app));
    createEffect(() => setClock(prefs.language.clock));
    return dispose;
  });
}
