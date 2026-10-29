import { expect, test } from "vite-plus/test";
import {
  allSatisfied,
  chosenSlot,
  durationError,
  emptySlot,
  enumMatches,
  parseDuration,
  slotFromInput,
  valuesOf,
  withoutRequiredFlags,
  withRequiredFlagged,
} from "./parse.ts";
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

const user: CommandOption = {
  name: "user",
  description: "COMMAND_SLOW_DURATION",
  type: "user",
  required: true,
};
const mode: CommandOption = {
  name: "mode",
  description: "COMMAND_SLOW_DURATION",
  type: "enum",
  values: ["on", "off"],
};
const seconds: CommandOption = {
  name: "seconds",
  description: "COMMAND_SLOW_DURATION",
  type: "duration",
  min: 3,
  max: 120,
};

test("typing fills a slot by its option type", () => {
  expect(slotFromInput(seconds, "1m").resolved).toBe(60);
  expect(slotFromInput(seconds, "1h").error?.kind).toBe("invalid");
  expect(slotFromInput(seconds, "")).toStrictEqual(emptySlot());
  expect(slotFromInput(mode, "on").resolved).toBe("on");
  expect(slotFromInput(mode, "o").error?.kind).toBe("invalid");
  expect(slotFromInput(user, "xqc")).toStrictEqual({
    raw: "xqc",
    displayLabel: "xqc",
    resolved: null,
    error: null,
  });
});

test("enum suggestions match anywhere, ignoring case", () => {
  expect(enumMatches(["on", "off"], "")).toStrictEqual(["on", "off"]);
  expect(enumMatches(["on", "off"], "F")).toStrictEqual(["off"]);
});

test("a missing required value flags, then clears without touching others", () => {
  const options = [user, mode];
  const slots = [emptySlot(), slotFromInput(mode, "o")];
  expect(allSatisfied(options, slots)).toBe(false);
  const flagged = withRequiredFlagged(options, slots);
  expect(flagged[0]?.error).toStrictEqual({ kind: "required" });
  expect(flagged[1]?.error?.kind).toBe("invalid");
  const cleared = withoutRequiredFlags(flagged);
  expect(cleared[0]?.error).toBeNull();
  expect(cleared[1]?.error?.kind).toBe("invalid");
});

test("values are keyed by option name, null when unset", () => {
  const options = [user, mode];
  const slots = [chosenSlot("xQc", "71092938"), emptySlot()];
  expect(allSatisfied(options, slots)).toBe(true);
  expect(valuesOf(options, slots)).toStrictEqual({
    user: "71092938",
    mode: null,
  });
});
