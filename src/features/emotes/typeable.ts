export type EmoteProvider = "Twitch" | "7TV" | "BetterTTV" | "FrankerFaceZ";
export type TypeableEmote = { url: string; source: EmoteProvider };
type Named = { name: string; url: string };

export function firstByName(
  lists: [EmoteProvider, Named[]][],
): Record<string, TypeableEmote> {
  const map: Record<string, TypeableEmote> = {};
  for (const [source, list] of lists) {
    for (const e of list) map[e.name] ??= { url: e.url, source };
  }
  return map;
}
