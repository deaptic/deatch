import { type EventCallback, listen } from "@tauri-apps/api/event";
import { EVENTSUB_EVENT_NAMES } from "../bindings.ts";
import type { EventEnvelope, EventKind } from "../types/twitch/eventsub.ts";

export function listenEventSub<T>(
  kind: EventKind,
  handler: EventCallback<EventEnvelope<T>>,
) {
  return listen<EventEnvelope<T>>(EVENTSUB_EVENT_NAMES[kind], handler);
}
