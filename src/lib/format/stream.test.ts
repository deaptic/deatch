import { expect, test } from "vite-plus/test";
import { formatClock, formatUptime, formatViewers } from "./stream.ts";

test("abbreviates viewer counts", () => {
  expect(formatViewers(999)).toBe("999");
  expect(formatViewers(1_000)).toBe("1.0K");
  expect(formatViewers(12_345)).toBe("12.3K");
  expect(formatViewers(2_500_000)).toBe("2.5M");
});

test("formats durations as h:mm:ss", () => {
  expect(formatClock(0)).toBe("0:00:00");
  expect(formatClock(61_000)).toBe("0:01:01");
  expect(formatClock(3_723_999)).toBe("1:02:03");
  expect(formatClock(-5_000)).toBe("0:00:00");
});

test("formats uptime from the given moment", () => {
  const start = Date.parse("2026-01-01T00:00:00Z");
  expect(formatUptime("2026-01-01T00:00:00Z", start + 61_000)).toBe("0:01:01");
});

test("returns empty uptime for an unparseable start", () => {
  expect(formatUptime("not a date", 0)).toBe("");
});
