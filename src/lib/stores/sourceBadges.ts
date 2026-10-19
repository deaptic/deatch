import { createStore, reconcile } from "solid-js/store";
import type { BadgeMap } from "../types/feed.ts";

/// Badge sets of shared chat partner channels, by channel id, so a partner
/// chatter's badges resolve against the channel they chatted in.
export const [sourceBadges, setSourceBadges] = createStore<
  Record<string, BadgeMap>
>({});

export function clearSourceBadges() {
  setSourceBadges(reconcile({}));
}
