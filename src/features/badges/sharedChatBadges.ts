import { createStore, reconcile } from "solid-js/store";
import type { BadgeMap } from "../feed/index.ts";

export const [sharedChatBadges, setSharedChatBadges] = createStore<
  Record<string, BadgeMap>
>({});

export function clearSharedChatBadges() {
  setSharedChatBadges(reconcile({}));
}
