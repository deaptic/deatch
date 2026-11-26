import { expect, test } from "vite-plus/test";
import { readFlag } from "./storage.ts";

test("an unset switch takes its own default", () => {
  expect(readFlag("gainControl", undefined)).toBe(true);
  expect(readFlag("compressorControl", undefined)).toBe(true);
  expect(readFlag("playerStats", undefined)).toBe(false);
  expect(readFlag("autoClaim", "yes")).toBe(false);
});

test("a stored choice wins over the default", () => {
  expect(readFlag("gainControl", false)).toBe(false);
  expect(readFlag("playerStats", true)).toBe(true);
});
