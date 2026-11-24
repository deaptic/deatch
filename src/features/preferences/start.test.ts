import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import {
  preferencesBackupKey,
  preferencesKey,
  STORAGE_KEYS,
} from "../../platform/storageKeys.ts";
import { load } from "./start.ts";
import { prefs } from "./core.ts";
import { PREFERENCES_VERSION } from "./schema/index.ts";

let items: Map<string, string>;

beforeEach(() => {
  items = new Map();
  vi.stubGlobal("localStorage", {
    get length() {
      return items.size;
    },
    key: (i: number) => [...items.keys()][i] ?? null,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
    removeItem: (key: string) => items.delete(key),
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("the old single block is split into sections and moved settings keep their values", () => {
  items.set(
    STORAGE_KEYS.legacyPreferences,
    JSON.stringify({
      advanced: { autostart: true, developerMode: true },
      feed: { showTimestamp: true },
    }),
  );
  load();
  expect(prefs.general.autostart).toBe(true);
  expect(prefs.advanced.developerMode).toBe(true);
  expect(prefs.feed.showTimestamp).toBe(true);
  expect(items.has(STORAGE_KEYS.legacyPreferences)).toBe(false);
  expect(items.get(STORAGE_KEYS.preferencesVersion)).toBe(
    String(PREFERENCES_VERSION),
  );
  expect(JSON.parse(items.get(preferencesKey("general")) ?? "")).toMatchObject({
    autostart: true,
  });
});

test("an unreadable section resets alone and its text is kept aside", () => {
  items.set(STORAGE_KEYS.preferencesVersion, String(PREFERENCES_VERSION));
  items.set(preferencesKey("feed"), "{broken");
  items.set(preferencesKey("advanced"), JSON.stringify({ showLogs: true }));
  load();
  expect(prefs.advanced.showLogs).toBe(true);
  expect(prefs.feed.showTimestamp).toBe(false);
  expect(items.get(preferencesBackupKey("feed"))).toBe("{broken");
});

test("sections at their defaults are saved empty", () => {
  load();
  expect(items.get(preferencesKey("notifications"))).toBe("{}");
  expect(items.get(preferencesKey("general"))).toBe("{}");
});
