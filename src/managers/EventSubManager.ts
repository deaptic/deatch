import { listen } from "@tauri-apps/api/event";
import { Manager } from "./Manager";
import { eventsubState, setEventsubState } from "../state/eventsub";
import { subscribe, unsubscribe } from "../commands/twitch/eventsub";
import type { EventKind, SubStatus } from "../types/twitch/eventsub";

type Payload = { broadcaster_id: string; kind: EventKind };
type FailedPayload = Payload & { error: string };

export class EventSubManager extends Manager {
  private static readonly RETRY_DELAY_MS = 3000;

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

  public async subscribe(broadcasterId: string, kind: EventKind): Promise<void> {
    this.setStatus(broadcasterId, kind, "pending");
    await subscribe({ broadcasterId, kind }, { silent: true }).catch(() => {});
  }

  public async unsubscribe(broadcasterId: string, kind: EventKind): Promise<void> {
    this.cancelRetry(broadcasterId, kind);
    this.clearStatus(broadcasterId, kind);
    await unsubscribe({ broadcasterId, kind }, { silent: true }).catch(() => {});
  }

  private onSubscribed({ broadcaster_id, kind }: Payload): void {
    this.cancelRetry(broadcaster_id, kind);
    this.setStatus(broadcaster_id, kind, "active");
  }

  private onFailed({ broadcaster_id, kind }: FailedPayload): void {
    const key = EventSubManager.keyOf(broadcaster_id, kind);
    if (this.retried.has(key)) {
      this.retried.delete(key);
      this.setStatus(broadcaster_id, kind, "failed");
      return;
    }
    this.retried.add(key);
    const timer = setTimeout(() => {
      this.retryTimers.delete(key);
      void this.subscribe(broadcaster_id, kind);
    }, EventSubManager.RETRY_DELAY_MS);
    this.retryTimers.set(key, timer);
  }

  private cancelRetry(broadcasterId: string, kind: EventKind): void {
    const key = EventSubManager.keyOf(broadcasterId, kind);
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

  private static keyOf(broadcasterId: string, kind: EventKind): string {
    return `${broadcasterId}|${kind}`;
  }
}

export const eventSubManager = new EventSubManager();
