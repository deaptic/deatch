import { t } from "../../shared/i18n/index.ts";
import type { EmoteEntry, EmoteSetUpdated } from "../../lib/types/index.ts";

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
    ...update.added.map((e) =>
      t("FEED_SEVENTV_EMOTE_ADDED_LINE", { actor: who, emote: e.name }),
    ),
    ...update.removed.map((n) =>
      t("FEED_SEVENTV_EMOTE_REMOVED_LINE", { actor: who, emote: n }),
    ),
    ...update.renamed.map((r) =>
      t("FEED_SEVENTV_EMOTE_RENAMED_LINE", {
        actor: who,
        from: r.from,
        to: r.to,
      }),
    ),
  ];
}

export function actor(update: EmoteSetUpdated): string {
  return update.actor ?? t("FEED_SEVENTV_SOMEONE_VALUE");
}
