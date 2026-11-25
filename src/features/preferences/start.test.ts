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
      advanced: { autostart: false, developerMode: true, showLogs: true },
      feed: { showTimestamp: true },
    }),
  );
  load();
  expect(prefs.system.autostart).toBe(false);
  expect(prefs.developer.mode).toBe(true);
  expect(prefs.developer.showLogs).toBe(true);
  expect(prefs.feed.showTimestamp).toBe(true);
  expect(items.has(STORAGE_KEYS.legacyPreferences)).toBe(false);
  expect(items.get(STORAGE_KEYS.preferencesVersion)).toBe(
    String(PREFERENCES_VERSION),
  );
  expect(JSON.parse(items.get(preferencesKey("system")) ?? "")).toMatchObject({
    autostart: false,
  });
});

test("an unreadable section resets alone and its text is kept aside", () => {
  items.set(STORAGE_KEYS.preferencesVersion, String(PREFERENCES_VERSION));
  items.set(preferencesKey("feed"), "{broken");
  items.set(preferencesKey("developer"), JSON.stringify({ showLogs: true }));
  load();
  expect(prefs.developer.showLogs).toBe(true);
  expect(prefs.feed.showTimestamp).toBe(false);
  expect(items.get(preferencesBackupKey("feed"))).toBe("{broken");
});

test("sections at their defaults are saved empty", () => {
  load();
  expect(items.get(preferencesKey("notifications"))).toBe("{}");
  expect(items.get(preferencesKey("system"))).toBe("{}");
});

test("settings saved before the pages were reorganised move to their pages and old sections go", () => {
  items.set(STORAGE_KEYS.preferencesVersion, "2");
  items.set(
    preferencesKey("general"),
    JSON.stringify({ alwaysOnTop: true, clock: "24h" }),
  );
  items.set(
    preferencesKey("advanced"),
    JSON.stringify({ hardwareAcceleration: false }),
  );
  items.set(
    preferencesKey("appearance"),
    JSON.stringify({ language: "fi", theme: "dark" }),
  );
  items.set(
    preferencesKey("feed"),
    JSON.stringify({ keywords: ["drop*"], showTimestamp: true }),
  );
  items.set(
    preferencesKey("streamer"),
    JSON.stringify({ on: true, auto: false }),
  );
  load();
  expect(prefs.system.alwaysOnTop).toBe(true);
  expect(prefs.system.hardwareAcceleration).toBe(false);
  expect(prefs.language).toStrictEqual({ app: "fi", clock: "24h" });
  expect(prefs.appearance.theme).toBe("dark");
  expect(prefs.notifications.keywords).toStrictEqual(["drop*"]);
  expect(prefs.feed.showTimestamp).toBe(true);
  expect(prefs.notifications.streamerMode).toBe(true);
  expect(prefs.notifications.streamerAuto).toBe(false);
  for (const retired of ["general", "advanced", "streamer"]) {
    expect(items.has(preferencesKey(retired))).toBe(false);
  }
});

test("saved sections survive a lost version number", () => {
  items.set(preferencesKey("developer"), JSON.stringify({ showLogs: true }));
  items.set(preferencesKey("feed"), JSON.stringify({ showTimestamp: true }));
  load();
  expect(prefs.developer.showLogs).toBe(true);
  expect(prefs.feed.showTimestamp).toBe(true);
  expect(JSON.parse(items.get(preferencesKey("feed")) ?? "")).toMatchObject({
    showTimestamp: true,
  });
});

test("the old block is kept when the new sections could not be saved", () => {
  const legacy = JSON.stringify({ feed: { showTimestamp: true } });
  items.set(STORAGE_KEYS.legacyPreferences, legacy);
  const full = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  load();
  full.mockRestore();
  expect(prefs.feed.showTimestamp).toBe(true);
  expect(items.get(STORAGE_KEYS.legacyPreferences)).toBe(legacy);
});
