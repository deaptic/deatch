import { expect, test } from "vite-plus/test";
import { textSegments } from "./textSegments.ts";

const emotes = { Kappa: "https://cdn/kappa" };

test("plain words stay one text segment", () => {
  expect(textSegments("hello there  friend", emotes)).toStrictEqual([
    { kind: "text", text: "hello there  friend" },
  ]);
});

test("emotes and links split the text around them", () => {
  expect(textSegments("hi Kappa see https://x.y/z ok", emotes)).toStrictEqual([
    { kind: "text", text: "hi " },
    { kind: "emote", name: "Kappa", url: "https://cdn/kappa" },
    { kind: "text", text: " see " },
    { kind: "link", url: "https://x.y/z" },
    { kind: "text", text: " ok" },
  ]);
});

test("empty text has no segments", () => {
  expect(textSegments("", emotes)).toStrictEqual([]);
});
