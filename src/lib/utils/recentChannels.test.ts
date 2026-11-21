import { expect, test } from "vite-plus/test";
import { RECENT_LIMIT, remember } from "./recentChannels.ts";

test("puts the latest channel first without duplicates", () => {
  expect(remember(["a", "b", "c"], "b")).toStrictEqual(["b", "a", "c"]);
  expect(remember([], "a")).toStrictEqual(["a"]);
});

test("keeps only the most recent channels", () => {
  const full = Array.from({ length: RECENT_LIMIT }, (_, i) => String(i));
  const next = remember(full, "new");
  expect(next).toHaveLength(RECENT_LIMIT);
  expect(next[0]).toBe("new");
  expect(next).not.toContain(String(RECENT_LIMIT - 1));
});
