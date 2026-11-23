import {
  type AppEventName,
  type AppEventPayload,
  onAppEvent,
  onEventSub,
} from "./events.ts";
import type { EventEnvelope, EventKind, Unlisten } from "../lib/types/index.ts";

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

export function unlistenAll(listeners: Promise<Unlisten>[]): () => void {
  const registered = listeners.map((listener) => listener.catch(() => null));
  return () => {
    for (const stop of registered) void stop.then((unlisten) => unlisten?.());
  };
}

export function serverTime(envelope: EventEnvelope<unknown>): number {
  return new Date(envelope.timestamp).getTime();
}
