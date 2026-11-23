import {
  type AppEventName,
  type AppEventPayload,
  onAppEvent,
  onEventSub,
} from "../../platform/events.ts";
import type {
  EventEnvelope,
  EventKind,
  FeedEntry,
  Unlisten,
} from "../types/index.ts";
import { appendItem } from "../stores/feeds.ts";

export function listenApp<K extends AppEventName>(
  name: K,
  handler: (payload: AppEventPayload<K>) => void,
): Promise<Unlisten> {
  return onAppEvent(name, handler, { silent: true });
}

export function listenEventSub<T>(
  kind: EventKind,
  handler: (envelope: EventEnvelope<T>) => void,
): Promise<Unlisten> {
  return onEventSub(kind, handler, { silent: true });
}

export function listenFeed<T>(
  kind: EventKind,
  toEntry: (raw: T, timestamp: number) => FeedEntry | null | undefined,
  channelOf: (raw: T) => string = (raw) =>
    (raw as { broadcaster_user_id: string }).broadcaster_user_id,
): Promise<Unlisten> {
  return listenEventSub<T>(kind, (e) => {
    const entry = toEntry(e.event, serverTime(e));
    if (entry) appendItem(channelOf(e.event), entry);
  });
}

export function unlistenAll(listeners: Promise<Unlisten>[]): () => void {
  const registered = listeners.map((listener) => listener.catch(() => null));
  return () => {
    for (const stop of registered) void stop.then((unlisten) => unlisten?.());
  };
}

export function serverTime(envelope: EventEnvelope<unknown>): number {
  return new Date(envelope.timestamp).getTime();
}
