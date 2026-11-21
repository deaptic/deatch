import { createStore, reconcile } from "solid-js/store";
import type { BadgeMap } from "../types/index.ts";

export const [sourceBadges, setSourceBadges] = createStore<
  Record<string, BadgeMap>
>({});

export function clearSourceBadges() {
  setSourceBadges(reconcile({}));
}
