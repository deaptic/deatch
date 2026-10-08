// Bridges `channel.chat.message` (carries the reward *id*) and
// `channel.channel_points_custom_reward_redemption.add` (carries the reward
// and user_input). When a reward is configured to echo user input into chat,
// both events fire — we attach the redemption to that chat message and
// suppress the standalone FeedEvent. Order isn't guaranteed: whichever side
// arrives first waits ~3s for the other. Rewards without input never echo
// into chat, so they post straight away.

import type { Redemption } from "../types/feed.ts";
import { setChannelPointsRedemption } from "../stores/feeds.ts";

const WINDOW_MS = 3000;

type PendingChat = {
  broadcasterId: string;
  messageId: string;
  timer: ReturnType<typeof setTimeout>;
};

type PendingRedemption = {
  redemption: Redemption;
  timer: ReturnType<typeof setTimeout>;
};

const chatPending = new Map<string, PendingChat[]>();
const redemptionPending = new Map<string, PendingRedemption[]>();

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

export function noteChatRedemption(
  broadcasterId: string,
  userId: string,
  rewardId: string,
  messageId: string,
): void {
  const k = key(broadcasterId, userId, rewardId);
  const pending = takeFirst(redemptionPending, k);
  if (pending) {
    clearTimeout(pending.timer);
    setChannelPointsRedemption(broadcasterId, messageId, pending.redemption);
    return;
  }
  const entry: PendingChat = {
    broadcasterId,
    messageId,
    timer: setTimeout(() => remove(chatPending, k, entry), WINDOW_MS),
  };
  enqueue(chatPending, k, entry);
}

export function correlateRedemption(
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
    clearTimeout(pending.timer);
    setChannelPointsRedemption(
      pending.broadcasterId,
      pending.messageId,
      redemption,
    );
    return;
  }
  const entry: PendingRedemption = {
    redemption,
    timer: setTimeout(() => {
      remove(redemptionPending, k, entry);
      emit();
    }, WINDOW_MS),
  };
  enqueue(redemptionPending, k, entry);
}
