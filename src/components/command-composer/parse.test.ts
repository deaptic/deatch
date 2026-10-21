/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { durationError, parseDuration } from "./parse.ts";
import type { CommandOption } from "./types.ts";

Deno.test("parses single, compound, unitless and padded durations", () => {
  assertEquals(parseDuration("30s"), 30);
  assertEquals(parseDuration("1h30m"), 5400);
  assertEquals(parseDuration("5M"), 300);
  assertEquals(parseDuration(" 5m "), 300);
  assertEquals(parseDuration("90"), 90);
  assertEquals(parseDuration("0"), 0);
});

Deno.test("rejects anything that is not a duration", () => {
  assertEquals(parseDuration(""), null);
  assertEquals(parseDuration("abc"), null);
  assertEquals(parseDuration("5x"), null);
  assertEquals(parseDuration("-5m"), null);
});

Deno.test("reports a value outside the option's range", () => {
  const opt: CommandOption = {
    name: "d",
    description: "COMMAND_SLOW_DURATION",
    type: "duration",
    min: 3,
    max: 120,
  };
  assertEquals(durationError(opt, 30), null);
  assertEquals(durationError(opt, 0), "Must be 3s–2m");
  assertEquals(durationError(opt, 300), "Must be 3s–2m");
  assertEquals(
    durationError({ ...opt, max: undefined }, 1),
    "Must be at least 3s",
  );
  assertEquals(
    durationError({ ...opt, hint: "COMMAND_SLOW_DURATION_HINT" }, null),
    "Try 3s–120s, default 30s",
  );
});
