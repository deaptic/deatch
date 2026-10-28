import { expect, test } from "vite-plus/test";
import {
  formatClock,
  formatUptime,
  formatViewers,
  liveLine,
  streamGame,
  streamTitle,
} from "./stream.ts";

test("abbreviates viewer counts in the given locale", () => {
  expect(formatViewers(999, "en-US")).toBe("999");
  expect(formatViewers(1_000, "en-US")).toBe("1K");
  expect(formatViewers(12_345, "en-US")).toBe("12.3K");
  expect(formatViewers(2_500_000, "en-US")).toBe("2.5M");
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

test("the live line leaves out what is unknown", () => {
  expect(liveLine("Chess", 1_500)).toBe(
    `Live · Chess · ${formatViewers(1_500)}`,
  );
  expect(liveLine("")).toBe("Live");
});

test("a live stream's title wins over the channel's last one", () => {
  const live = { title: "now", game: { name: "Chess" } };
  const last = { title: "before", game: { name: "Go" } };
  expect(streamTitle(live, last)).toBe("now");
  expect(streamGame(undefined, last)).toBe("Go");
  expect(streamTitle()).toBe("");
});
