import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { STORAGE_KEYS, userEmotesKey } from "../constants/storage.ts";
import { prune, read, write } from "./storage.ts";

const KEY = STORAGE_KEYS.mentions;

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

test("reads back what was written", () => {
  write(KEY, { a: [1, 2] });
  expect(read(KEY)).toStrictEqual({ a: [1, 2] });
});

test("a missing key reads as null", () => {
  expect(read(KEY)).toBeNull();
});

test("broken JSON reads as null and is logged", () => {
  items.set(KEY, "{not json");
  expect(read(KEY)).toBeNull();
  expect(console.warn).toHaveBeenCalledOnce();
});

test("a failed write is logged, not thrown", () => {
  vi.stubGlobal("localStorage", {
    setItem: () => {
      throw new Error("quota");
    },
  });
  expect(() => write(KEY, 1)).not.toThrow();
  expect(console.warn).toHaveBeenCalledOnce();
});

test("prune removes only keys the app no longer reads", () => {
  const kept = [...Object.values(STORAGE_KEYS), userEmotesKey("42")];
  for (const key of [...kept, "chat_density", "cache:user_emotes", "badge_x"]) {
    items.set(key, "1");
  }
  prune();
  expect([...items.keys()]).toStrictEqual(kept);
});
