type Saved = { value: string; url: string; label: string };

export type EmoteUse = Saved & { count: number; lastUsed: number };

export const KEPT_USES = 60;
export const SHOWN_USES = 24;

const byUse = (a: EmoteUse, b: EmoteUse) =>
  b.count - a.count || b.lastUsed - a.lastUsed;

export function withUse(
  list: readonly EmoteUse[],
  used: Saved,
  now: number,
): EmoteUse[] {
  const previous = list.find((e) => e.value === used.value);
  const updated: EmoteUse = {
    ...used,
    count: (previous?.count ?? 0) + 1,
    lastUsed: now,
  };
  return [updated, ...list.filter((e) => e.value !== used.value)]
    .sort(byUse)
    .slice(0, KEPT_USES);
}

export function emotesIn(
  text: string,
  emotes: Readonly<Record<string, { url: string }>>,
): Saved[] {
  const names = new Set(
    text.split(/\s+/).filter((word) => Object.hasOwn(emotes, word)),
  );
  return [...names].map((name) => ({
    value: name,
    url: emotes[name]!.url,
    label: name,
  }));
}

export function mostUsed(list: readonly EmoteUse[]): EmoteUse[] {
  return [...list].sort(byUse).slice(0, SHOWN_USES);
}
