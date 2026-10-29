import { expect, test } from "vite-plus/test";
import type { EmoteGridItem } from "./types.ts";
import { indexSections, itemAt, matchingItems } from "./sections.ts";

const item = (label: string): EmoteGridItem => ({
  value: label,
  url: `https://cdn/${label}.png`,
  label,
});

const kappa = item("Kappa");
const lul = item("LUL");
const pog = item("PogChamp");

test("indexSections numbers items across sections", () => {
  const sections = indexSections([
    { label: "a", items: [kappa, lul] },
    { label: "empty", items: [] },
    { items: [pog] },
  ]);
  expect(sections.map((s) => s.startIndex)).toStrictEqual([0, 2, 2]);
});

test("itemAt finds the item behind a flat index", () => {
  const sections = indexSections([{ items: [kappa, lul] }, { items: [pog] }]);
  expect(itemAt(sections, 1)).toBe(lul);
  expect(itemAt(sections, 2)).toBe(pog);
  expect(itemAt(sections, 3)).toBeUndefined();
});

test("matchingItems matches labels case-insensitively", () => {
  expect(matchingItems([kappa, lul, pog], "pA")).toStrictEqual([kappa]);
  expect(matchingItems([kappa, lul, pog], "l")).toStrictEqual([lul]);
});
