/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { formatBytes, formatPercent } from "./size.ts";

Deno.test("formatBytes picks the largest whole unit", () => {
  assertEquals(formatBytes(512), "512 B");
  assertEquals(formatBytes(2048), "2 KB");
  assertEquals(formatBytes(190_840_832), "182 MB");
  assertEquals(formatBytes(1.5 * 1024 ** 3), "1.5 GB");
});

Deno.test("formatPercent keeps one decimal below ten", () => {
  assertEquals(formatPercent(0), "0.0%");
  assertEquals(formatPercent(2.345), "2.3%");
  assertEquals(formatPercent(42.6), "43%");
});
