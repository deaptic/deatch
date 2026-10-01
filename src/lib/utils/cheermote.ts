import type { Cheermote, CheermoteTier } from "../types/index.ts";

export type CheermoteMap = Record<string, CheermoteTier[]>;

export function buildCheermoteMap(cheermotes: Cheermote[]): CheermoteMap {
  return Object.fromEntries(
    cheermotes.map((c) => [c.prefix.toLowerCase(), c.tiers]),
  );
}

export function cheermoteTier(
  map: CheermoteMap,
  prefix: string,
  bits: number,
): CheermoteTier | undefined {
  const tiers = map[prefix.toLowerCase()] ?? [];
  return tiers.findLast((t) => t.minBits <= bits);
}
