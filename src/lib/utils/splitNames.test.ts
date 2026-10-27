/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { splitNames } from "./splitNames.ts";

Deno.test("splits a leading name", () => {
  assertEquals(splitNames("viewer23 subscribed at Tier 1.", ["viewer23"]), [
    { text: "viewer23", person: 0 },
    { text: " subscribed at Tier 1." },
  ]);
});

Deno.test("links every person, ignoring case", () => {
  assertEquals(splitNames("Mod banned foo_bar: spam", ["Foo_Bar", "Mod"]), [
    { text: "Mod", person: 1 },
    { text: " banned " },
    { text: "foo_bar", person: 0 },
    { text: ": spam" },
  ]);
});

Deno.test("prefers the longer of two overlapping names", () => {
  assertEquals(splitNames("Foo_Bar raided", ["Foo", "Foo_Bar"]), [
    { text: "Foo_Bar", person: 1 },
    { text: " raided" },
  ]);
});

Deno.test("matches whole words only", () => {
  assertEquals(splitNames("Annabel gifted a sub", ["Anna"]), [
    { text: "Annabel gifted a sub" },
  ]);
});

Deno.test("treats regex characters in names literally", () => {
  assertEquals(splitNames("axb followed!", ["a.b"]), [
    { text: "axb followed!" },
  ]);
  assertEquals(splitNames("a.b followed!", ["a.b"])[0], {
    text: "a.b",
    person: 0,
  });
});

Deno.test("no names, one plain run", () => {
  assertEquals(splitNames("Chat was cleared", [""]), [
    { text: "Chat was cleared" },
  ]);
});
