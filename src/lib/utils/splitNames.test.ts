import { expect, test } from "vite-plus/test";
import { splitNames } from "./splitNames.ts";

test("splits a leading name", () => {
  expect(
    splitNames("viewer23 subscribed at Tier 1.", ["viewer23"]),
  ).toStrictEqual([
    { text: "viewer23", person: 0 },
    { text: " subscribed at Tier 1." },
  ]);
});

test("links every person, ignoring case", () => {
  expect(
    splitNames("Mod banned foo_bar: spam", ["Foo_Bar", "Mod"]),
  ).toStrictEqual([
    { text: "Mod", person: 1 },
    { text: " banned " },
    { text: "foo_bar", person: 0 },
    { text: ": spam" },
  ]);
});

test("prefers the longer of two overlapping names", () => {
  expect(splitNames("Foo_Bar raided", ["Foo", "Foo_Bar"])).toStrictEqual([
    { text: "Foo_Bar", person: 1 },
    { text: " raided" },
  ]);
});

test("matches whole words only", () => {
  expect(splitNames("Annabel gifted a sub", ["Anna"])).toStrictEqual([
    { text: "Annabel gifted a sub" },
  ]);
});

test("treats regex characters in names literally", () => {
  expect(splitNames("axb followed!", ["a.b"])).toStrictEqual([
    { text: "axb followed!" },
  ]);
  expect(splitNames("a.b followed!", ["a.b"])[0]).toStrictEqual({
    text: "a.b",
    person: 0,
  });
});

test("no names, one plain run", () => {
  expect(splitNames("Chat was cleared", [""])).toStrictEqual([
    { text: "Chat was cleared" },
  ]);
});
