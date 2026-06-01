// Bridges `channel.chat.message` (carries the reward *id*) and
// `channel.channel_points_custom_reward_redemption.add` (carries the reward
// *title* and user_input). When a reward is configured to echo user input
// into chat, both events fire — we merge them into a single chat message
// annotated with the reward title and suppress the standalone FeedEvent.
// Order isn't guaranteed: whichever side arrives first waits ~3s for the
// other.

import { setChannelPointsRewardTitle } from "../stores/feeds.ts";

const WINDOW_MS = 3000;

type PendingChat = {
  broadcasterId: string;
  messageId: string;
  timer: ReturnType<typeof setTimeout>;
};

type PendingRedemption = {
  rewardTitle: string;
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
    setChannelPointsRewardTitle(broadcasterId, messageId, pending.rewardTitle);
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
  rewardId: string,
  rewardTitle: string,
  emit: () => void,
): void {
  const k = key(broadcasterId, userId, rewardId);
  const pending = chatPending.get(k);
  if (pending) {
    clearTimeout(pending.timer);
    chatPending.delete(k);
    setChannelPointsRewardTitle(pending.broadcasterId, pending.messageId, rewardTitle);
    return;
  }
  const existing = redemptionPending.get(k);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => {
    redemptionPending.delete(k);
    emit();
  }, WINDOW_MS);
  redemptionPending.set(k, { rewardTitle, timer, emit });
}
