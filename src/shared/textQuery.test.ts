import { expect, test } from "vite-plus/test";
import { matchesQuery } from "./textQuery.ts";

test("an empty query matches everything", () => {
  expect(matchesQuery("", "Theme")).toBe(true);
  expect(matchesQuery("   ", undefined)).toBe(true);
});

test("matches any text, ignoring case and surrounding space", () => {
  expect(matchesQuery(" SOUND ", "Mention sound", undefined)).toBe(true);
  expect(matchesQuery("blink", "Theme", "Light or dark")).toBe(false);
  expect(matchesQuery("dark", "Theme", "Light or dark")).toBe(true);
});
