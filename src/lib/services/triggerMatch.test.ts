import { expect, test } from "vite-plus/test";
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

test("anywhere matches whole words only", () => {
  expect(fires("well hello there", {})).toStrictEqual(true);
  expect(fires("othello", {})).toStrictEqual(false);
  expect(fires("hellos", {})).toStrictEqual(false);
});

test("start requires the phrase at the beginning", () => {
  expect(fires("hello there", { location: "start" })).toStrictEqual(true);
  expect(fires("oh hello", { location: "start" })).toStrictEqual(false);
});

test("exact compares the trimmed message", () => {
  expect(fires("  Hello  ", { location: "exact" })).toStrictEqual(true);
  expect(fires("hello there", { location: "exact" })).toStrictEqual(false);
});

test("respects case sensitivity", () => {
  expect(fires("HELLO", {})).toStrictEqual(true);
  expect(fires("HELLO", { caseSensitive: true })).toStrictEqual(false);
  expect(
    fires("HELLO", { location: "exact", caseSensitive: true }),
  ).toStrictEqual(false);
});

test("matches command phrases that start with punctuation", () => {
  expect(fires("!socials", { phrase: "!socials" })).toStrictEqual(true);
  expect(fires("check !socials please", { phrase: "!socials" })).toStrictEqual(
    true,
  );
  expect(
    fires("!socials", { phrase: "!socials", location: "start" }),
  ).toStrictEqual(true);
  expect(fires("!socialsx", { phrase: "!socials" })).toStrictEqual(false);
});

test("treats regex characters in phrases literally", () => {
  expect(fires("is this (a) test?", { phrase: "(a) test?" })).toStrictEqual(
    true,
  );
  expect(fires("is this a test", { phrase: "(a) test?" })).toStrictEqual(false);
  expect(fires("axb", { phrase: "a.b" })).toStrictEqual(false);
});

test("accepts any of several phrases, one per line", () => {
  const multi = { phrase: "discord\n\n  socials  " };
  expect(fires("where are your socials", multi)).toStrictEqual(true);
  expect(fires("join the discord", multi)).toStrictEqual(true);
  expect(fires("twitter", multi)).toStrictEqual(false);
});

test("phrases accept * wildcards in every location", () => {
  expect(fires("hiya all", { phrase: "hi*" })).toStrictEqual(true);
  expect(fires("hiya", { phrase: "hi*", location: "exact" })).toStrictEqual(
    true,
  );
  expect(fires("oh hiya", { phrase: "hi*", location: "start" })).toStrictEqual(
    false,
  );
  expect(fires("anything", { phrase: "*" })).toStrictEqual(false);
});

test("skips disabled and blank triggers and returns the first match", () => {
  const disabled = trigger({ id: "off", enabled: false });
  const blank = trigger({ id: "blank", phrase: "   " });
  const second = trigger({ id: "second" });
  expect(firstMatch("hello", [disabled, blank, second])?.id).toStrictEqual(
    "second",
  );
  expect(firstMatch("   ", [second])).toStrictEqual(null);
});

test("cools down for the configured seconds", () => {
  expect(isCoolingDown(undefined, 10_000, 5)).toStrictEqual(false);
  expect(isCoolingDown(10_000, 14_999, 5)).toStrictEqual(true);
  expect(isCoolingDown(10_000, 15_000, 5)).toStrictEqual(false);
});
