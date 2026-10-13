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

const fromNow = (ms: number) => new Date(Date.now() + ms);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

Deno.test("relative format names the largest unit, past and future", () => {
  assertEquals(
    new Time(fromNow(-2 * HOUR - 30_000), "r").toString(),
    "2 hours ago",
  );
  assertEquals(
    new Time(fromNow(3 * HOUR + 30_000), "r").toString(),
    "in 3 hours",
  );
  assertEquals(new Time(fromNow(-20_000), "r").toString(), "now");
});

Deno.test("long relative format spells out each unit with its direction", () => {
  assertEquals(
    new Time(fromNow(-(3 * HOUR + 20 * MINUTE + 30_000)), "R").toString(),
    "3 hours, 20 minutes ago",
  );
  assertEquals(
    new Time(fromNow(45 * MINUTE + 30_000), "R").toString(),
    "in 45 minutes",
  );
});

Deno.test("long relative format keeps the three largest units", () => {
  const then = Temporal.Now.zonedDateTimeISO().subtract({
    years: 2,
    days: 4,
    hours: 5,
    minutes: 6,
  });
  assertEquals(
    new Time(then.epochMilliseconds, "R").toString(),
    "2 years, 4 days, 5 hours ago",
  );
});
