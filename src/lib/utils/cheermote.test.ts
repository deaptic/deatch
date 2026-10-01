/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
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

Deno.test("cheermoteTier picks the highest tier the amount reaches", () => {
  assertEquals(cheermoteTier(MAP, "cheer", 1)?.minBits, 1);
  assertEquals(cheermoteTier(MAP, "Cheer", 999)?.minBits, 100);
  assertEquals(cheermoteTier(MAP, "CHEER", 5000)?.minBits, 1000);
});

Deno.test("cheermoteTier misses unknown prefixes", () => {
  assertEquals(cheermoteTier(MAP, "Kappa", 100), undefined);
});
