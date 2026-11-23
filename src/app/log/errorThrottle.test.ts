import { expect, test } from "vite-plus/test";
import { createErrorThrottle } from "./errorThrottle.ts";

test("shows each error once per window, and different errors separately", () => {
  const shouldShow = createErrorThrottle(60_000);
  expect(shouldShow("Stale read", 0)).toBe(true);
  expect(shouldShow("Stale read", 1_000)).toBe(false);
  expect(shouldShow("Other", 1_000)).toBe(true);
  expect(shouldShow("Stale read", 61_000)).toBe(true);
});
