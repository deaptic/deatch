import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { read, write } from "./storage.ts";

let items: Map<string, string>;

beforeEach(() => {
  items = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("reads back what was written", () => {
  write("k", { a: [1, 2] });
  expect(read("k")).toStrictEqual({ a: [1, 2] });
});

test("a missing key reads as null", () => {
  expect(read("missing")).toBeNull();
});

test("broken JSON reads as null and is logged", () => {
  items.set("k", "{not json");
  expect(read("k")).toBeNull();
  expect(console.warn).toHaveBeenCalledOnce();
});

test("a failed write is logged, not thrown", () => {
  vi.stubGlobal("localStorage", {
    setItem: () => {
      throw new Error("quota");
    },
  });
  expect(() => write("k", 1)).not.toThrow();
  expect(console.warn).toHaveBeenCalledOnce();
});
