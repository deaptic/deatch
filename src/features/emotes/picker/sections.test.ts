import { expect, test } from "vite-plus/test";
import type { EmoteGridItem } from "./types.ts";
import {
  indexSections,
  itemAt,
  mergeProviders,
  providerScope,
  matchingItems,
} from "./sections.ts";

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
    { id: "a", label: "a", items: [kappa, lul] },
    { id: "empty", label: "empty", items: [] },
    { id: "c", items: [pog] },
  ]);
  expect(sections.map((s) => s.startIndex)).toStrictEqual([0, 2, 2]);
});

test("itemAt finds the item behind a flat index", () => {
  const sections = indexSections([
    { id: "a", items: [kappa, lul] },
    { id: "b", items: [pog] },
  ]);
  expect(itemAt(sections, 1)).toBe(lul);
  expect(itemAt(sections, 2)).toBe(pog);
  expect(itemAt(sections, 3)).toBeUndefined();
});

test("matchingItems matches labels case-insensitively", () => {
  expect(matchingItems([kappa, lul, pog], "pA")).toStrictEqual([kappa]);
  expect(matchingItems([kappa, lul, pog], "l")).toStrictEqual([lul]);
});

test("mergeProviders joins each provider's emotes, channel first, and leads with them", () => {
  const merged = mergeProviders([
    { id: "twitch", items: [kappa] },
    { id: "7tv-channel", label: "7TV", items: [lul] },
    { id: "twitch-global", items: [pog] },
    { id: "7tv", label: "7TV", items: [lul, pog] },
  ]);
  expect(merged.map((s) => [s.id, s.items])).toStrictEqual([
    ["7tv", [lul, pog]],
    ["twitch", [kappa]],
    ["twitch-global", [pog]],
  ]);
});

test("mergeProviders keeps 7TV, BTTV, FFZ order even when the channel lacks one", () => {
  const merged = mergeProviders([
    { id: "7tv-channel", items: [kappa] },
    { id: "ffz-channel", items: [lul] },
    { id: "bttv", items: [pog] },
  ]);
  expect(merged.map((s) => s.id)).toStrictEqual(["7tv", "bttv", "ffz"]);
});

test("providerScope tells a provider's channel emotes from its global ones", () => {
  expect(providerScope("7tv-channel")).toBe("channel");
  expect(providerScope("bttv")).toBe("global");
  expect(providerScope("twitch")).toBeNull();
});
