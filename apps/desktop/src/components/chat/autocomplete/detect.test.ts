/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { detect } from "./detect.ts";

Deno.test("detects commands only at the start", () => {
  assertEquals(detect("/ba"), { kind: "command", query: "ba" });
  assertEquals(detect("/"), { kind: "command", query: "" });
  assertEquals(detect("hi /ba"), null);
});

Deno.test("detects emotes and mentions after whitespace", () => {
  assertEquals(detect("lol :Kap"), { kind: "emote", query: "Kap" });
  assertEquals(detect(":"), null);
  assertEquals(detect("hey @bo"), { kind: "mention", query: "bo" });
  assertEquals(detect("mail@bo"), null);
});
