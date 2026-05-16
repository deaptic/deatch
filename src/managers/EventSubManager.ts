import { listen } from "@tauri-apps/api/event";
import { Manager } from "./Manager";
import { eventsubState, setEventsubState } from "../state/eventsub";
import type { EventKind, SubStatus } from "../types/eventsub";

const RETRY_DELAY_MS = 3000;
const keyOf = (b: string, k: EventKind) => `${b}|${k}`;

type Payload = { broadcaster_id: string; kind: EventKind };
type FailedPayload = Payload & { error: string };

export class EventSubManager extends Manager {
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private retried = new Set<string>();

  constructor() {
    super();
    void listen<Payload>("eventsub-subscribed", (e) => this.onSubscribed(e.payload));
    void listen<FailedPayload>("eventsub-subscribe-failed", (e) => this.onFailed(e.payload));
    void listen<Payload>("eventsub-unsubscribed", (e) =>
      this.setStatus(e.payload.broadcaster_id, e.payload.kind, "disconnected"),
    );
  }

  public subscribe(broadcasterId: string, kind: EventKind): Promise<void | null> {
    this.setStatus(broadcasterId, kind, "pending");
    return this.invokeCommand("subscribe", { broadcasterId, kind }, { silent: true });
  }

  public unsubscribe(broadcasterId: string, kind: EventKind): Promise<void | null> {
    this.cancelRetry(broadcasterId, kind);
    this.clearStatus(broadcasterId, kind);
    return this.invokeCommand("unsubscribe", { broadcasterId, kind }, { silent: true });
  }

  private onSubscribed({ broadcaster_id, kind }: Payload): void {
    this.cancelRetry(broadcaster_id, kind);
    this.setStatus(broadcaster_id, kind, "active");
  }

  /// One retry after a fixed delay; on the second failure we give up.
  private onFailed({ broadcaster_id, kind }: FailedPayload): void {
    const key = keyOf(broadcaster_id, kind);
    if (this.retried.has(key)) {
      this.retried.delete(key);
      this.setStatus(broadcaster_id, kind, "failed");
      return;
    }
    this.retried.add(key);
    const timer = setTimeout(() => {
      this.retryTimers.delete(key);
      void this.subscribe(broadcaster_id, kind);
    }, RETRY_DELAY_MS);
    this.retryTimers.set(key, timer);
  }

  private cancelRetry(broadcasterId: string, kind: EventKind): void {
    const key = keyOf(broadcasterId, kind);
    const t = this.retryTimers.get(key);
    if (t !== undefined) {
      clearTimeout(t);
      this.retryTimers.delete(key);
    }
    this.retried.delete(key);
  }

  private setStatus(broadcasterId: string, kind: EventKind, status: SubStatus): void {
    const prev = eventsubState();
    const channelMap = new Map(prev.get(broadcasterId) ?? []);
    channelMap.set(kind, status);
    const next = new Map(prev);
    next.set(broadcasterId, channelMap);
    setEventsubState(next);
  }

  private clearStatus(broadcasterId: string, kind: EventKind): void {
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
}

export const eventSubManager = new EventSubManager();
