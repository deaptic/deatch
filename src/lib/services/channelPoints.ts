// Bridges `channel.chat.message` (carries the reward *id*) and
// `channel.channel_points_custom_reward_redemption.add` (carries the reward
// and user_input). When a reward is configured to echo user input into chat,
// both events fire — we attach the redemption to that chat message and
// suppress the standalone FeedEvent. Order isn't guaranteed: whichever side
// arrives first waits ~3s for the other. Rewards without input never echo
// into chat, so they post straight away.

import type { Redemption } from "../types/index.ts";
import { setChannelPointsRedemption } from "../stores/feeds.ts";
import { createTimeouts } from "../utils/timeouts.ts";

const WINDOW_MS = 3000;

type Timeout = ReturnType<typeof setTimeout>;

type PendingChat = {
  broadcasterId: string;
  messageId: string;
  timer: Timeout;
};

type PendingRedemption = {
  redemption: Redemption;
  timer: Timeout;
};

const chatPending = new Map<string, PendingChat[]>();
const redemptionPending = new Map<string, PendingRedemption[]>();
const timeouts = createTimeouts();

export function start(): () => void {
  return () => {
    timeouts.clear();
    chatPending.clear();
    redemptionPending.clear();
  };
}

function key(broadcasterId: string, userId: string, rewardId: string): string {
  return `${broadcasterId}:${userId}:${rewardId}`;
}

function takeFirst<T>(queue: Map<string, T[]>, k: string): T | undefined {
  const list = queue.get(k);
  if (!list?.length) return undefined;
  const first = list.shift();
  if (list.length === 0) queue.delete(k);
  return first;
}

function enqueue<T>(queue: Map<string, T[]>, k: string, item: T) {
  const list = queue.get(k) ?? [];
  list.push(item);
  queue.set(k, list);
}

function remove<T>(queue: Map<string, T[]>, k: string, item: T) {
  const list = queue.get(k)?.filter((x) => x !== item) ?? [];
  if (list.length === 0) queue.delete(k);
  else queue.set(k, list);
}

export function noteChatMessage(
  broadcasterId: string,
  userId: string,
  rewardId: string,
  messageId: string,
): void {
  const k = key(broadcasterId, userId, rewardId);
  const pending = takeFirst(redemptionPending, k);
  if (pending) {
    timeouts.cancel(pending.timer);
    setChannelPointsRedemption(broadcasterId, messageId, pending.redemption);
    return;
  }
  const entry: PendingChat = {
    broadcasterId,
    messageId,
    timer: timeouts.after(WINDOW_MS, () => remove(chatPending, k, entry)),
  };
  enqueue(chatPending, k, entry);
}

export function correlate(
  broadcasterId: string,
  userId: string,
  redemption: Redemption,
  emit: () => void,
): void {
  if (!redemption.input) {
    emit();
    return;
  }
  const k = key(broadcasterId, userId, redemption.reward.id);
  const pending = takeFirst(chatPending, k);
  if (pending) {
    timeouts.cancel(pending.timer);
    setChannelPointsRedemption(
      pending.broadcasterId,
      pending.messageId,
      redemption,
    );
    return;
  }
  const entry: PendingRedemption = {
    redemption,
    timer: timeouts.after(WINDOW_MS, () => {
      remove(redemptionPending, k, entry);
      emit();
    }),
  };
  enqueue(redemptionPending, k, entry);
}
