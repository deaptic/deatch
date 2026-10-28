import { expect, test } from "vite-plus/test";
import { buildCheermoteMap, cheermoteTier } from "./cheermote.ts";
import type { CheermoteTier } from "../types/index.ts";

const tier = (minBits: number): CheermoteTier => ({
  minBits,
  color: `#${minBits}`,
  dark: { animated: `dark/${minBits}.gif`, still: `dark/${minBits}.png` },
  light: { animated: `light/${minBits}.gif`, still: `light/${minBits}.png` },
});

const MAP = buildCheermoteMap([
  { prefix: "Cheer", tiers: [tier(1), tier(100), tier(1000)] },
]);

test("cheermoteTier picks the highest tier the amount reaches", () => {
  expect(cheermoteTier(MAP, "cheer", 1)?.minBits).toStrictEqual(1);
  expect(cheermoteTier(MAP, "Cheer", 999)?.minBits).toStrictEqual(100);
  expect(cheermoteTier(MAP, "CHEER", 5000)?.minBits).toStrictEqual(1000);
});

test("cheermoteTier misses unknown prefixes", () => {
  expect(cheermoteTier(MAP, "Kappa", 100)).toStrictEqual(undefined);
});
