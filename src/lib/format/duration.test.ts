/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { formatApproxDuration, formatDuration } from "./duration.ts";

Deno.test("formatDuration uses the largest unit that divides evenly", () => {
  assertEquals(formatDuration(0), "0s");
  assertEquals(formatDuration(90), "90s");
  assertEquals(formatDuration(120), "2m");
  assertEquals(formatDuration(129600), "36h");
  assertEquals(formatDuration(1209600), "2w");
});

Deno.test("formatApproxDuration rounds to the nearest whole unit", () => {
  assertEquals(formatApproxDuration(0), "0s");
  assertEquals(formatApproxDuration(30), "30s");
  assertEquals(formatApproxDuration(599), "10m");
  assertEquals(formatApproxDuration(7200), "2h");
  assertEquals(formatApproxDuration(604800), "7d");
});
