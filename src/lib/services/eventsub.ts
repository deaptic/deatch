import { events } from "../bindings.ts";
import { eventsubState, setEventsubState } from "../stores/eventsub.ts";
import {
  subscribe as subscribeKind,
  unsubscribe as unsubscribeKind,
} from "../api/twitch/eventsub.ts";
import type { EventKind, SubStatus } from "../types/twitch/eventsub.ts";

const RETRY_DELAY_MS = 3000;

const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const retried = new Set<string>();

export function start(): () => void {
  const unlisten = events.eventSubSubscription.listen(({ payload }) => {
    const { broadcasterId, kind, status } = payload;
    switch (status.type) {
      case "subscribed":
        onSubscribed(broadcasterId, kind);
        break;
      case "failed":
        onFailed(broadcasterId, kind);
        break;
      case "unsubscribed":
        setStatus(broadcasterId, kind, "disconnected");
        break;
    }
  });
  return () => {
    void unlisten.then((stop) => stop());
    for (const timer of retryTimers.values()) clearTimeout(timer);
    retryTimers.clear();
    retried.clear();
  };
}

export async function subscribe(
  broadcasterId: string,
  kind: EventKind,
): Promise<void> {
  setStatus(broadcasterId, kind, "pending");
  await subscribeKind({ broadcasterId, kind }, { silent: true }).catch(
    () => {},
  );
}

export async function unsubscribe(
  broadcasterId: string,
  kind: EventKind,
): Promise<void> {
  cancelRetry(broadcasterId, kind);
  clearStatus(broadcasterId, kind);
  await unsubscribeKind({ broadcasterId, kind }, { silent: true }).catch(
    () => {},
  );
}

function onSubscribed(broadcasterId: string, kind: EventKind): void {
  cancelRetry(broadcasterId, kind);
  setStatus(broadcasterId, kind, "active");
}

function onFailed(broadcasterId: string, kind: EventKind): void {
  const key = keyOf(broadcasterId, kind);
  if (retried.has(key)) {
    retried.delete(key);
    setStatus(broadcasterId, kind, "failed");
    return;
  }
  retried.add(key);
  const timer = setTimeout(() => {
    retryTimers.delete(key);
    void subscribe(broadcasterId, kind);
  }, RETRY_DELAY_MS);
  retryTimers.set(key, timer);
}

function cancelRetry(broadcasterId: string, kind: EventKind): void {
  const key = keyOf(broadcasterId, kind);
  const timer = retryTimers.get(key);
  if (timer !== undefined) {
    clearTimeout(timer);
    retryTimers.delete(key);
  }
  retried.delete(key);
}

function setStatus(
  broadcasterId: string,
  kind: EventKind,
  status: SubStatus,
): void {
  const prev = eventsubState();
  const channelMap = new Map(prev.get(broadcasterId) ?? []);
  channelMap.set(kind, status);
  const next = new Map(prev);
  next.set(broadcasterId, channelMap);
  setEventsubState(next);
}

function clearStatus(broadcasterId: string, kind: EventKind): void {
  const prev = eventsubState();
  const channelMap = prev.get(broadcasterId);
  if (!channelMap) return;
  const nextChannelMap = new Map(channelMap);
  nextChannelMap.delete(kind);
  const next = new Map(prev);
  if (nextChannelMap.size === 0) next.delete(broadcasterId);
  else next.set(broadcasterId, nextChannelMap);
  setEventsubState(next);
}

function keyOf(broadcasterId: string, kind: EventKind): string {
  return `${broadcasterId}|${kind}`;
}
