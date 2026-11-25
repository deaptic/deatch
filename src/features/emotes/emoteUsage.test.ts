import { expect, test } from "vite-plus/test";
import { emotesIn, type EmoteUse, mostUsed, withUse } from "./emoteUsage.ts";

const emote = (value: string) => ({ value, url: "", label: value });
const use = (value: string, count: number, lastUsed: number): EmoteUse => ({
  ...emote(value),
  count,
  lastUsed,
});

test("each use counts up and the most used comes first", () => {
  const list = withUse([use("a", 2, 1), use("b", 2, 2)], emote("a"), 3);
  expect(list.map((e) => [e.value, e.count])).toStrictEqual([
    ["a", 3],
    ["b", 2],
  ]);
});

test("a new emote starts at one use", () => {
  expect(withUse([], emote("a"), 5)).toStrictEqual([use("a", 1, 5)]);
});

test("ties go to the one used more recently", () => {
  expect(
    mostUsed([use("old", 1, 1), use("new", 1, 9)]).map((e) => e.value),
  ).toStrictEqual(["new", "old"]);
});

test("emotes in a sent message are found once each, other words are ignored", () => {
  const emotes = { KEKW: { url: "u/kekw" }, Kappa: { url: "u/kappa" } };
  expect(emotesIn("KEKW KEKW nice Kappa constructor", emotes)).toStrictEqual([
    { value: "KEKW", url: "u/kekw", label: "KEKW" },
    { value: "Kappa", url: "u/kappa", label: "Kappa" },
  ]);
});
