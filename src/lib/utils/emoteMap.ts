export type EmoteMap = Record<string, string>;

export function emoteMap(
  lists: readonly (readonly { name: string; url: string }[])[],
): EmoteMap {
  const map: EmoteMap = Object.create(null);
  for (const list of lists) for (const e of list) map[e.name] = e.url;
  return map;
}
