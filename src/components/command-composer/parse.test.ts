import { expect, test } from "vite-plus/test";
import { durationError, parseDuration } from "./parse.ts";
import type { CommandOption } from "./types.ts";

test("parses single, compound, unitless and padded durations", () => {
  expect(parseDuration("30s")).toStrictEqual(30);
  expect(parseDuration("1h30m")).toStrictEqual(5400);
  expect(parseDuration("5M")).toStrictEqual(300);
  expect(parseDuration(" 5m ")).toStrictEqual(300);
  expect(parseDuration("90")).toStrictEqual(90);
  expect(parseDuration("0")).toStrictEqual(0);
});

test("rejects anything that is not a duration", () => {
  expect(parseDuration("")).toStrictEqual(null);
  expect(parseDuration("abc")).toStrictEqual(null);
  expect(parseDuration("5x")).toStrictEqual(null);
  expect(parseDuration("-5m")).toStrictEqual(null);
});

test("reports a value outside the option's range", () => {
  const opt: CommandOption = {
    name: "d",
    description: "COMMAND_SLOW_DURATION",
    type: "duration",
    min: 3,
    max: 120,
  };
  expect(durationError(opt, 30)).toStrictEqual(null);
  expect(durationError(opt, 0)).toStrictEqual("Must be 3s–2m");
  expect(durationError(opt, 300)).toStrictEqual("Must be 3s–2m");
  expect(durationError({ ...opt, max: undefined }, 1)).toStrictEqual(
    "Must be at least 3s",
  );
  expect(
    durationError({ ...opt, hint: "COMMAND_SLOW_DURATION_HINT" }, null),
  ).toStrictEqual("Try 3s–120s, default 30s");
});
