// Bridges `channel.chat.message` (carries the reward *id*) and
// `channel.channel_points_custom_reward_redemption.add` (carries the reward
// and user_input). When a reward is configured to echo user input into chat,
// both events fire — we attach the redemption to that chat message and
// suppress the standalone FeedEvent. Order isn't guaranteed: whichever side
// arrives first waits ~3s for the other.

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
  emit: () => void;
};

const chatPending = new Map<string, PendingChat>();
const redemptionPending = new Map<string, PendingRedemption>();

function key(broadcasterId: string, userId: string, rewardId: string): string {
  return `${broadcasterId}:${userId}:${rewardId}`;
}

export function noteChatRedemption(
  broadcasterId: string,
  userId: string,
  rewardId: string,
  messageId: string,
): void {
  const k = key(broadcasterId, userId, rewardId);
  const pending = redemptionPending.get(k);
  if (pending) {
    clearTimeout(pending.timer);
    redemptionPending.delete(k);
    setChannelPointsRedemption(broadcasterId, messageId, pending.redemption);
    return;
  }
  const existing = chatPending.get(k);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => chatPending.delete(k), WINDOW_MS);
  chatPending.set(k, { broadcasterId, messageId, timer });
}

export function correlateRedemption(
  broadcasterId: string,
  userId: string,
  redemption: Redemption,
  emit: () => void,
): void {
  const k = key(broadcasterId, userId, redemption.reward.id);
  const pending = chatPending.get(k);
  if (pending) {
    clearTimeout(pending.timer);
    chatPending.delete(k);
    setChannelPointsRedemption(
      pending.broadcasterId,
      pending.messageId,
      redemption,
    );
    return;
  }
  const existing = redemptionPending.get(k);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => {
    redemptionPending.delete(k);
    emit();
  }, WINDOW_MS);
  redemptionPending.set(k, { redemption, timer, emit });
}
