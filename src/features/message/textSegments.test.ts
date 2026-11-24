import { expect, test } from "vite-plus/test";
import { linksIn, textSegments } from "./textSegments.ts";

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

test("links are found between words and other text is ignored", () => {
  expect(linksIn("see https://a.b/c and http://d.e  www.f.g")).toStrictEqual([
    "https://a.b/c",
    "http://d.e",
  ]);
});
