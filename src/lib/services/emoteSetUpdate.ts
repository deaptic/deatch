import type { EmoteEntry, EmoteSetUpdated } from "../types/index.ts";

export function apply(
  emotes: EmoteEntry[],
  update: EmoteSetUpdated,
): EmoteEntry[] {
  const removed = new Set(update.removed);
  const renames = new Map(update.renamed.map((r) => [r.from, r.to]));
  const kept = emotes.flatMap((e) => {
    if (removed.has(e.name)) return [];
    const renamed = renames.get(e.name);
    return [renamed ? { ...e, name: renamed } : e];
  });
  return [...kept, ...update.added];
}

export function describe(update: EmoteSetUpdated): string[] {
  const who = actor(update);
  return [
    ...update.added.map((e) => `${who} added 7TV emote ${e.name}`),
    ...update.removed.map((n) => `${who} removed 7TV emote ${n}`),
    ...update.renamed.map((r) =>
      `${who} renamed 7TV emote ${r.from} to ${r.to}`
    ),
  ];
}

export function actor(update: EmoteSetUpdated): string {
  return update.actor ?? "Someone";
}
