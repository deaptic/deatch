/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { daysBetween, Time } from "./time.ts";

const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

Deno.test("counts calendar days, not 24-hour spans", () => {
  const late = new Date(2026, 8, 30, 23, 59);
  const early = new Date(2026, 9, 1, 0, 1);
  assertEquals(daysBetween(late, early), 1);
  assertEquals(daysBetween(early, early), 0);
  assertEquals(daysBetween(new Date(2026, 8, 28), early), 3);
});

Deno.test("calendar format shows only the time for today", () => {
  assertEquals(new Time(at(0, 10, 49), "c").toString(), "10:49");
});

Deno.test("calendar format names yesterday", () => {
  assertEquals(new Time(at(1, 10, 49), "c").toString(), "Yesterday at 10:49");
});

Deno.test("calendar format shows the date for older times", () => {
  const d = new Date(2025, 8, 29, 22, 24);
  assertEquals(new Time(d, "c").toString(), "29/09/2025 22:24");
});
