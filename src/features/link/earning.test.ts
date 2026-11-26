import { expect, test } from "vite-plus/test";
import { EARNING_WINDOW_MS, isEarning } from "./earning.ts";

const AT = "2026-11-26T19:23:04Z";
const T = Date.parse(AT);

test("a channel earns until a watch payout is older than the window", () => {
  expect(isEarning(AT, T + 60_000)).toBe(true);
  expect(isEarning(AT, T + EARNING_WINDOW_MS - 1)).toBe(true);
  expect(isEarning(AT, T + EARNING_WINDOW_MS)).toBe(false);
});

test("no payout or an unreadable time is not earning", () => {
  expect(isEarning(undefined, T)).toBe(false);
  expect(isEarning("soon", T)).toBe(false);
});
