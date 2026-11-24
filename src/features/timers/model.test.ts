import { expect, test } from "vite-plus/test";
import { isDue } from "./model.ts";

const timer = { enabled: true, message: "Hi", minutes: 10, minMessages: 5 };
const run = { lastPostedAt: 0, messagesSince: 5 };
const later = 10 * 60_000;

test("a timer is due once its interval has passed and chat was active enough", () => {
  expect(isDue(timer, run, later)).toBe(true);
  expect(isDue(timer, run, later - 1)).toBe(false);
  expect(isDue(timer, { ...run, messagesSince: 4 }, later)).toBe(false);
});

test("a timer that is off or empty is never due", () => {
  expect(isDue({ ...timer, enabled: false }, run, later)).toBe(false);
  expect(isDue({ ...timer, message: "  " }, run, later)).toBe(false);
});
