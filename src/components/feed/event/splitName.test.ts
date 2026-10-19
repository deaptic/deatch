/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { splitName } from "./splitName.ts";

Deno.test("splits a leading name", () => {
  assertEquals(splitName("viewer23 subscribed at Tier 1.", "viewer23"), {
    before: "",
    name: "viewer23",
    after: " subscribed at Tier 1.",
  });
});

Deno.test("finds the name mid-sentence, ignoring case", () => {
  assertEquals(splitName("5 raiders from Foo_Bar have joined!", "foo_bar"), {
    before: "5 raiders from ",
    name: "Foo_Bar",
    after: " have joined!",
  });
});

Deno.test("matches whole words only", () => {
  assertEquals(splitName("Annabel gifted a sub", "Anna"), null);
});

Deno.test("treats regex characters in names literally", () => {
  assertEquals(splitName("a.b followed!", "a.b")?.after, " followed!");
  assertEquals(splitName("axb followed!", "a.b"), null);
});

Deno.test("no name, no split", () => {
  assertEquals(splitName("Chat was cleared", ""), null);
});
