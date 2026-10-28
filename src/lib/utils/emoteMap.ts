export type EmoteMap = Record<string, string>;

/// Emote name to image url; a later list wins a name the earlier ones share.
export function emoteMap(
  lists: readonly (readonly { name: string; url: string }[])[],
): EmoteMap {
  // No prototype: chat words like "constructor" must not hit Object.prototype.
  const map: EmoteMap = Object.create(null);
  for (const list of lists) for (const e of list) map[e.name] = e.url;
  return map;
}
