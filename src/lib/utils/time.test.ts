import { expect, test } from "vite-plus/test";
import { daysBetween, Time } from "./time.ts";

const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

test("counts calendar days, not 24-hour spans", () => {
  const late = new Date(2026, 8, 30, 23, 59);
  const early = new Date(2026, 9, 1, 0, 1);
  expect(daysBetween(late, early)).toBe(1);
  expect(daysBetween(early, early)).toBe(0);
  expect(daysBetween(new Date(2026, 8, 28), early)).toBe(3);
});

test("calendar format shows only the time for today", () => {
  expect(new Time(at(0, 10, 49), "c").toString()).toBe("10:49");
});

test("calendar format names yesterday", () => {
  expect(new Time(at(1, 10, 49), "c").toString()).toBe("Yesterday at 10:49");
});

test("calendar format shows the date for older times", () => {
  const d = new Date(2025, 8, 29, 22, 24);
  expect(new Time(d, "c").toString()).toBe("29/09/2025 22:24");
});

const fromNow = (ms: number) => new Date(Date.now() + ms);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

test("relative format names the largest unit, past and future", () => {
  expect(new Time(fromNow(-2 * HOUR - 30_000), "r").toString()).toBe(
    "2 hours ago",
  );
  expect(new Time(fromNow(3 * HOUR + 30_000), "r").toString()).toBe(
    "in 3 hours",
  );
  expect(new Time(fromNow(-20_000), "r").toString()).toBe("now");
});

test("long relative format spells out each unit with its direction", () => {
  expect(
    new Time(fromNow(-(3 * HOUR + 20 * MINUTE + 30_000)), "R").toString(),
  ).toBe("3 hours, 20 minutes ago");
  expect(new Time(fromNow(45 * MINUTE + 30_000), "R").toString()).toBe(
    "in 45 minutes",
  );
});

test("long relative format keeps the three largest units", () => {
  const then = Temporal.Now.zonedDateTimeISO().subtract({
    years: 2,
    days: 4,
    hours: 5,
    minutes: 6,
  });
  expect(new Time(then.epochMilliseconds, "R").toString()).toBe(
    "2 years, 4 days, 5 hours ago",
  );
});
