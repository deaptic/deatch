import { expect, test } from "vite-plus/test";
import type { Trigger } from "../preferences/index.ts";
import { firstMatch, isCoolingDown, roleAllows } from "./match.ts";

const trigger = (overrides: Partial<Trigger>): Trigger => ({
  id: "t1",
  enabled: true,
  name: "",
  phrase: "hello",
  location: "anywhere",
  caseSensitive: false,
  cooldown: 5,
  action: "reply",
  replies: [],
  otherwise: "hi!",
  role: "everyone",
  count: 0,
  ...overrides,
});

const fires = (text: string, overrides: Partial<Trigger>) =>
  firstMatch(text, [trigger(overrides)]) !== null;

test("anywhere matches whole words only", () => {
  expect(fires("well hello there", {})).toBe(true);
  expect(fires("othello", {})).toBe(false);
  expect(fires("hellos", {})).toBe(false);
});

test("start requires the phrase at the beginning", () => {
  expect(fires("hello there", { location: "start" })).toBe(true);
  expect(fires("oh hello", { location: "start" })).toBe(false);
});

test("exact compares the trimmed message", () => {
  expect(fires("  Hello  ", { location: "exact" })).toBe(true);
  expect(fires("hello there", { location: "exact" })).toBe(false);
});

test("respects case sensitivity", () => {
  expect(fires("HELLO", {})).toBe(true);
  expect(fires("HELLO", { caseSensitive: true })).toBe(false);
  expect(fires("HELLO", { location: "exact", caseSensitive: true })).toBe(
    false,
  );
});

test("matches command phrases that start with punctuation", () => {
  expect(fires("!socials", { phrase: "!socials" })).toBe(true);
  expect(fires("check !socials please", { phrase: "!socials" })).toBe(true);
  expect(fires("!socials", { phrase: "!socials", location: "start" })).toBe(
    true,
  );
  expect(fires("!socialsx", { phrase: "!socials" })).toBe(false);
});

test("treats regex characters in phrases literally", () => {
  expect(fires("is this (a) test?", { phrase: "(a) test?" })).toBe(true);
  expect(fires("is this a test", { phrase: "(a) test?" })).toBe(false);
  expect(fires("axb", { phrase: "a.b" })).toBe(false);
});

test("accepts any of several phrases, one per line", () => {
  const multi = { phrase: "discord\n\n  socials  " };
  expect(fires("where are your socials", multi)).toBe(true);
  expect(fires("join the discord", multi)).toBe(true);
  expect(fires("twitter", multi)).toBe(false);
});

test("phrases accept * wildcards in every location", () => {
  expect(fires("hiya all", { phrase: "hi*" })).toBe(true);
  expect(fires("hiya", { phrase: "hi*", location: "exact" })).toBe(true);
  expect(fires("oh hiya", { phrase: "hi*", location: "start" })).toBe(false);
  expect(fires("anything", { phrase: "*" })).toBe(false);
});

test("skips disabled and blank triggers and returns the first match", () => {
  const disabled = trigger({ id: "off", enabled: false });
  const blank = trigger({ id: "blank", phrase: "   " });
  const second = trigger({ id: "second" });
  expect(firstMatch("hello", [disabled, blank, second])?.trigger.id).toBe(
    "second",
  );
  expect(firstMatch("   ", [second])).toBeNull();
});

test("cools down for the configured seconds", () => {
  expect(isCoolingDown(undefined, 10_000, 5)).toBe(false);
  expect(isCoolingDown(10_000, 14_999, 5)).toBe(true);
  expect(isCoolingDown(10_000, 15_000, 5)).toBe(false);
});

test("hands back what follows the matched phrase as arguments", () => {
  const fired = firstMatch("!followage  @someone extra", [
    trigger({ phrase: "!followage", location: "start" }),
  ]);
  expect(fired?.args).toBe("@someone extra");
});

test("a role lets that role and everyone above it through", () => {
  expect(roleAllows("everyone", [])).toBe(true);
  expect(roleAllows("vip", ["subscriber"])).toBe(false);
  expect(roleAllows("vip", ["moderator"])).toBe(true);
  expect(roleAllows("moderator", ["broadcaster"])).toBe(true);
  expect(roleAllows("broadcaster", ["moderator"])).toBe(false);
  expect(roleAllows("subscriber", ["founder"])).toBe(true);
});
