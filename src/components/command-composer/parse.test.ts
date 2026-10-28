import { expect, test } from "vite-plus/test";
import { durationError, parseDuration } from "./parse.ts";
import type { CommandOption } from "./types.ts";

test("parses single, compound, unitless and padded durations", () => {
  expect(parseDuration("30s")).toBe(30);
  expect(parseDuration("1h30m")).toBe(5400);
  expect(parseDuration("5M")).toBe(300);
  expect(parseDuration(" 5m ")).toBe(300);
  expect(parseDuration("90")).toBe(90);
  expect(parseDuration("0")).toBe(0);
});

test("rejects anything that is not a duration", () => {
  expect(parseDuration("")).toBeNull();
  expect(parseDuration("abc")).toBeNull();
  expect(parseDuration("5x")).toBeNull();
  expect(parseDuration("-5m")).toBeNull();
});

test("reports a value outside the option's range", () => {
  const opt: CommandOption = {
    name: "d",
    description: "COMMAND_SLOW_DURATION",
    type: "duration",
    min: 3,
    max: 120,
  };
  expect(durationError(opt, 30)).toBeNull();
  expect(durationError(opt, 0)).toBe("Must be 3s–2m");
  expect(durationError(opt, 300)).toBe("Must be 3s–2m");
  expect(durationError({ ...opt, max: undefined }, 1)).toBe(
    "Must be at least 3s",
  );
  expect(
    durationError({ ...opt, hint: "COMMAND_SLOW_DURATION_HINT" }, null),
  ).toBe("Try 3s–120s, default 30s");
});
