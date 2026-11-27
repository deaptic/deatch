import { expect, test } from "vite-plus/test";
import type { EmoteUse } from "./emoteUsage.ts";
import { rankEmotes, useScore } from "./rankEmotes.ts";

const DAY = 24 * 60 * 60 * 1000;
const now = 100 * DAY;
const emotes = ["LUL", "LULW", "LULE", "OMEGALUL", "KEKW"].map((name) => ({
  name,
}));
const use = (value: string, count: number, daysAgo = 0): EmoteUse => ({
  value,
  url: "",
  label: value,
  count,
  lastUsed: now - daysAgo * DAY,
});

const rank = (query: string, uses: EmoteUse[]) =>
  rankEmotes(emotes, query, uses, now, 10).map((e) => e.name);

test("without history, prefix matches come before partial ones", () => {
  expect(rank("lu", [])).toStrictEqual(["LUL", "LULE", "LULW", "OMEGALUL"]);
});

test("a used partial match moves above unused prefix matches", () => {
  expect(rank("lu", [use("OMEGALUL", 5)])).toStrictEqual([
    "OMEGALUL",
    "LUL",
    "LULE",
    "LULW",
  ]);
});

test("used emotes are ordered by how often and how lately they were used", () => {
  expect(rank("lu", [use("LULW", 9, 60), use("LULE", 3)])).toStrictEqual([
    "LULE",
    "LULW",
    "LUL",
    "OMEGALUL",
  ]);
});

test("an exact match stays first over any history", () => {
  expect(rank("lul", [use("OMEGALUL", 50)])[0]).toBe("LUL");
});

test("a use loses half its weight every two weeks", () => {
  expect(useScore(use("a", 8, 28), now)).toBeCloseTo(2);
});
