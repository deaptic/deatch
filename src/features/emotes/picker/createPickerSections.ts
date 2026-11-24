import { createEffect, createMemo } from "solid-js";
import {
  computeChannelSections,
  computeGlobalSections,
  emoteUses,
  favorites,
  usableUserEmotes,
} from "../store.ts";
import { usableIn } from "../emoteSections.ts";
import { mostUsed } from "../emoteUsage.ts";
import { selectedChannel } from "../../navigation/index.ts";
import { users } from "../../users/index.ts";
import { isUserId } from "../../../shared/user.ts";
import { t } from "../../../shared/i18n/index.ts";
import {
  mergeProviders,
  type PickerSection,
  providerScope,
} from "./sections.ts";
import { toItem } from "./helpers.ts";
import { EMOJI_SECTIONS } from "./emoji.ts";
import type { EmoteGridItem } from "./types.ts";

const SAVED = new Set(["favorites", "frequent"]);

export type ItemSource = { section: PickerSection; item: EmoteGridItem };

function prefetchSubscriptionOwners() {
  createEffect(() => {
    const broadcaster = selectedChannel();
    const ids = new Set<string>();
    for (const e of usableUserEmotes()) {
      if (
        e.emoteType === "subscriptions" &&
        e.ownerId &&
        e.ownerId !== broadcaster?.id &&
        isUserId(e.ownerId)
      ) {
        ids.add(e.ownerId);
      }
    }
    if (ids.size) users.get([...ids]).catch(() => {});
  });
}

export function createPickerSections() {
  prefetchSubscriptionOwners();

  const channelSections = createMemo(() =>
    computeChannelSections(selectedChannel()),
  );
  const globalSections = createMemo(() =>
    computeGlobalSections(selectedChannel()),
  );
  const usable = createMemo(() =>
    usableIn([...channelSections(), ...globalSections()]),
  );

  const emoteSections = createMemo<PickerSection[]>(() =>
    mergeProviders(
      [...channelSections(), ...globalSections()].map((s) => {
        const scope = providerScope(s.id);
        return {
          id: s.id,
          label: s.label,
          items: s.emotes.map((e) =>
            scope ? { ...toItem(e), scope } : toItem(e),
          ),
        };
      }),
    ),
  );

  const saved = (
    id: string,
    label: string,
    empty: string,
    list: readonly EmoteGridItem[],
  ): PickerSection => ({
    id,
    label,
    empty,
    items: list.map((f) => ({ ...f, disabled: !usable()(f.value) })),
  });

  const browseSections = createMemo<PickerSection[]>(() => [
    saved(
      "favorites",
      t("EMOTES_FAVORITES_TITLE"),
      t("EMOTES_FAVORITES_EMPTY"),
      favorites(),
    ),
    saved(
      "frequent",
      t("EMOTES_FREQUENT_TITLE"),
      t("EMOTES_FREQUENT_EMPTY"),
      mostUsed(emoteUses()),
    ),
    ...emoteSections(),
  ]);

  const sourceOf = createMemo(() => {
    const map = new Map<string, ItemSource>();
    for (const section of [...browseSections(), ...EMOJI_SECTIONS]) {
      if (SAVED.has(section.id)) continue;
      for (const item of section.items) {
        if (!map.has(item.value)) map.set(item.value, { section, item });
      }
    }
    return map;
  });

  return { emoteSections, browseSections, sourceOf };
}
