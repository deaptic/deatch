/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { Trigger } from "../stores/preferences.ts";
import { firstMatch, isCoolingDown } from "./triggerMatch.ts";

const trigger = (overrides: Partial<Trigger>): Trigger => ({
  id: "t1",
  enabled: true,
  name: "",
  phrase: "hello",
  location: "anywhere",
  caseSensitive: false,
  cooldown: 5,
  action: "reply",
  response: "hi!",
  ...overrides,
});

const fires = (text: string, overrides: Partial<Trigger>) =>
  firstMatch(text, [trigger(overrides)]) !== null;

Deno.test("anywhere matches whole words only", () => {
  assertEquals(fires("well hello there", {}), true);
  assertEquals(fires("othello", {}), false);
  assertEquals(fires("hellos", {}), false);
});

Deno.test("start requires the phrase at the beginning", () => {
  assertEquals(fires("hello there", { location: "start" }), true);
  assertEquals(fires("oh hello", { location: "start" }), false);
});

Deno.test("exact compares the trimmed message", () => {
  assertEquals(fires("  Hello  ", { location: "exact" }), true);
  assertEquals(fires("hello there", { location: "exact" }), false);
});

Deno.test("respects case sensitivity", () => {
  assertEquals(fires("HELLO", {}), true);
  assertEquals(fires("HELLO", { caseSensitive: true }), false);
  assertEquals(
    fires("HELLO", { location: "exact", caseSensitive: true }),
    false,
  );
});

Deno.test("matches command phrases that start with punctuation", () => {
  assertEquals(fires("!socials", { phrase: "!socials" }), true);
  assertEquals(fires("check !socials please", { phrase: "!socials" }), true);
  assertEquals(
    fires("!socials", { phrase: "!socials", location: "start" }),
    true,
  );
  assertEquals(fires("!socialsx", { phrase: "!socials" }), false);
});

Deno.test("treats regex characters in phrases literally", () => {
  assertEquals(fires("is this (a) test?", { phrase: "(a) test?" }), true);
  assertEquals(fires("is this a test", { phrase: "(a) test?" }), false);
  assertEquals(fires("axb", { phrase: "a.b" }), false);
});

Deno.test("accepts any of several phrases, one per line", () => {
  const multi = { phrase: "discord\n\n  socials  " };
  assertEquals(fires("where are your socials", multi), true);
  assertEquals(fires("join the discord", multi), true);
  assertEquals(fires("twitter", multi), false);
});

Deno.test("skips disabled and blank triggers and returns the first match", () => {
  const disabled = trigger({ id: "off", enabled: false });
  const blank = trigger({ id: "blank", phrase: "   " });
  const second = trigger({ id: "second" });
  assertEquals(firstMatch("hello", [disabled, blank, second])?.id, "second");
  assertEquals(firstMatch("   ", [second]), null);
});

Deno.test("cools down for the configured seconds", () => {
  assertEquals(isCoolingDown(undefined, 10_000, 5), false);
  assertEquals(isCoolingDown(10_000, 14_999, 5), true);
  assertEquals(isCoolingDown(10_000, 15_000, 5), false);
});
