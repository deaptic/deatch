/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { formatShortDuration } from "./duration.ts";

Deno.test("formatShortDuration picks the largest whole unit", () => {
  assertEquals(formatShortDuration(0), "0s");
  assertEquals(formatShortDuration(30), "30s");
  assertEquals(formatShortDuration(600), "10m");
  assertEquals(formatShortDuration(7200), "2h");
  assertEquals(formatShortDuration(604800), "7d");
});
