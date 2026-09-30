import { cancelRaid, startRaid } from "../api/twitch/raids.ts";
import {
  pendingRaid,
  RAID_DURATION_MS,
  type RaidTarget,
  setPendingRaid,
} from "../stores/raid.ts";

let expiry: ReturnType<typeof setTimeout> | undefined;

export async function begin(fromId: string, target: RaidTarget): Promise<void> {
  await startRaid({ fromBroadcasterId: fromId, toBroadcasterId: target.id });
  clearExpiry();
  setPendingRaid({ fromId, target, startedAt: Date.now() });
  expiry = setTimeout(() => setPendingRaid(null), RAID_DURATION_MS);
}

export async function cancel(fromId?: string): Promise<void> {
  const broadcasterId = fromId ?? pendingRaid()?.fromId;
  clearExpiry();
  setPendingRaid(null);
  if (broadcasterId) await cancelRaid({ broadcasterId }).catch(() => {});
}

function clearExpiry(): void {
  if (expiry === undefined) return;
  clearTimeout(expiry);
  expiry = undefined;
}
