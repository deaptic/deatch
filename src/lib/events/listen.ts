import {
  type EventCallback,
  listen,
  type UnlistenFn,
} from "@tauri-apps/api/event";
import { EVENTSUB_EVENT_NAMES } from "../bindings.ts";
import type { EventEnvelope, EventKind } from "../types/twitch/eventsub.ts";
import type { FeedEntry } from "../types/feed.ts";
import { appendItem } from "../stores/feeds.ts";

export function listenEventSub<T>(
  kind: EventKind,
  handler: EventCallback<EventEnvelope<T>>,
): Promise<UnlistenFn> {
  return listen<EventEnvelope<T>>(EVENTSUB_EVENT_NAMES[kind], handler);
}

/// One Twitch event, one row in its channel's feed, or none when `toEntry`
/// says so. Nearly every event names its channel `broadcaster_user_id`.
export function listenFeed<T>(
  kind: EventKind,
  toEntry: (raw: T, timestamp: number) => FeedEntry | null | undefined,
  channelOf: (raw: T) => string = (raw) =>
    (raw as { broadcaster_user_id: string }).broadcaster_user_id,
): Promise<UnlistenFn> {
  return listenEventSub<T>(kind, (e) => {
    const raw = e.payload.event;
    const entry = toEntry(raw, serverTime(e.payload));
    if (entry) appendItem(channelOf(raw), entry);
  });
}

export function unlistenAll(listeners: Promise<UnlistenFn>[]): () => void {
  return () => {
    for (const listener of listeners) void listener.then((stop) => stop());
  };
}

export function serverTime(envelope: EventEnvelope<unknown>): number {
  return new Date(envelope.timestamp).getTime();
}
