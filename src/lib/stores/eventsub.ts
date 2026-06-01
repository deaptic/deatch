import { createSignal } from "solid-js";
import type { EventKind, SubStatus } from "../types/twitch/eventsub";

export const [eventsubState, setEventsubState] = createSignal<
  Map<string, Map<EventKind, SubStatus>>
>(new Map());
