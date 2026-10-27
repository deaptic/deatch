/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { textSegments } from "./textSegments.ts";

const emotes = { Kappa: "https://cdn/kappa" };

Deno.test("plain words stay one text segment", () => {
  assertEquals(textSegments("hello there  friend", emotes), [
    { kind: "text", text: "hello there  friend" },
  ]);
});

Deno.test("emotes and links split the text around them", () => {
  assertEquals(textSegments("hi Kappa see https://x.y/z ok", emotes), [
    { kind: "text", text: "hi " },
    { kind: "emote", name: "Kappa", url: "https://cdn/kappa" },
    { kind: "text", text: " see " },
    { kind: "link", url: "https://x.y/z" },
    { kind: "text", text: " ok" },
  ]);
});

Deno.test("empty text has no segments", () => {
  assertEquals(textSegments("", emotes), []);
});
