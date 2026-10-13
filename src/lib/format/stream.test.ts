/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { formatClock, formatUptime, formatViewers } from "./stream.ts";

Deno.test("abbreviates viewer counts", () => {
  assertEquals(formatViewers(999), "999");
  assertEquals(formatViewers(1_000), "1.0K");
  assertEquals(formatViewers(12_345), "12.3K");
  assertEquals(formatViewers(2_500_000), "2.5M");
});

Deno.test("formats durations as h:mm:ss", () => {
  assertEquals(formatClock(0), "0:00:00");
  assertEquals(formatClock(61_000), "0:01:01");
  assertEquals(formatClock(3_723_999), "1:02:03");
  assertEquals(formatClock(-5_000), "0:00:00");
});

Deno.test("formats uptime from the given moment", () => {
  const start = Date.parse("2026-01-01T00:00:00Z");
  assertEquals(formatUptime("2026-01-01T00:00:00Z", start + 61_000), "0:01:01");
});

Deno.test("returns empty uptime for an unparseable start", () => {
  assertEquals(formatUptime("not a date", 0), "");
});
