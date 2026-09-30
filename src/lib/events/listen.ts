import {
  type EventCallback,
  listen,
  type UnlistenFn,
} from "@tauri-apps/api/event";
import { EVENTSUB_EVENT_NAMES } from "../bindings.ts";
import type { EventEnvelope, EventKind } from "../types/twitch/eventsub.ts";

export function listenEventSub<T>(
  kind: EventKind,
  handler: EventCallback<EventEnvelope<T>>,
): Promise<UnlistenFn> {
  return listen<EventEnvelope<T>>(EVENTSUB_EVENT_NAMES[kind], handler);
}

export function unlistenAll(listeners: Promise<UnlistenFn>[]): () => void {
  return () => {
    for (const listener of listeners) void listener.then((stop) => stop());
  };
}
