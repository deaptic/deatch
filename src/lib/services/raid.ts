import { cancelRaid, startRaid } from "../api/twitch/raids.ts";
import { sendShoutout } from "../api/twitch/chat.ts";
import { isModOfChannel } from "../stores/users.ts";
import { moderationAutoShoutoutOnRaid } from "../stores/preferences.ts";
import type { UserRef } from "../types/index.ts";
import {
  pendingRaid,
  RAID_DURATION_MS,
  setPendingRaid,
} from "../stores/raid.ts";

let expiry: ReturnType<typeof setTimeout> | undefined;

export async function begin(fromId: string, target: UserRef): Promise<void> {
  await startRaid({ fromBroadcasterId: fromId, toBroadcasterId: target.id });
  clearExpiry();
  setPendingRaid({ fromId, target, startedAt: Date.now() });
  expiry = setTimeout(() => setPendingRaid(null), RAID_DURATION_MS);
}

export async function cancel(fromId?: string): Promise<void> {
  const broadcasterId = fromId ?? pendingRaid()?.fromId;
  if (broadcasterId) await cancelRaid({ broadcasterId });
  clearExpiry();
  setPendingRaid(null);
}

export function shoutOutRaider(channelId: string, raiderId: string): void {
  if (!moderationAutoShoutoutOnRaid() || !isModOfChannel(channelId)) return;
  sendShoutout(
    { fromBroadcasterId: channelId, toBroadcasterId: raiderId },
    { silent: true },
  ).catch(() => {});
}

function clearExpiry(): void {
  if (expiry === undefined) return;
  clearTimeout(expiry);
  expiry = undefined;
}
