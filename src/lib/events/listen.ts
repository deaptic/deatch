import {
  type AppEventName,
  type AppEventPayload,
  onAppEvent,
  onEventSub,
} from "../api/events.ts";
import type { EventEnvelope, EventKind } from "../types/twitch/eventsub.ts";
import type { FeedEntry } from "../types/feed.ts";
import { appendItem } from "../stores/feeds.ts";

type Unlisten = () => void;

/// Listeners run in the background, so a failed registration is logged
/// rather than toasted.
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

/// One Twitch event, one row in its channel's feed, or none when `toEntry`
/// says so. Nearly every event names its channel `broadcaster_user_id`.
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
  // A listener that failed to register was logged by invokeCommand.
  const registered = listeners.map((listener) => listener.catch(() => null));
  return () => {
    for (const stop of registered) void stop.then((unlisten) => unlisten?.());
  };
}

export function serverTime(envelope: EventEnvelope<unknown>): number {
  return new Date(envelope.timestamp).getTime();
}
