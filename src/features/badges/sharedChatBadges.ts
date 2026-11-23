import { createStore, reconcile } from "solid-js/store";
import type { BadgeMap } from "../../lib/types/index.ts";

export const [sharedChatBadges, setSharedChatBadges] = createStore<
  Record<string, BadgeMap>
>({});

export function clearSharedChatBadges() {
  setSharedChatBadges(reconcile({}));
}
