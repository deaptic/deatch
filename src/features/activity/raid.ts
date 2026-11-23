import { createSignal } from "solid-js";
import { cancelRaid, startRaid } from "../../platform/twitch/raids.ts";
import { sendShoutout } from "../../platform/twitch/chat.ts";
import { hasPermission } from "../permissions/index.ts";
import { moderationAutoShoutoutOnRaid } from "../preferences/index.ts";
import type { UserRef } from "../../shared/types/index.ts";

export const RAID_DURATION_MS = 90_000;

export type PendingRaid = {
  fromId: string;
  target: UserRef;
  startedAt: number;
};

const [pending, setPending] = createSignal<PendingRaid | null>(null);
export { pending };

let expiry: ReturnType<typeof setTimeout> | undefined;

export async function begin(fromId: string, target: UserRef): Promise<void> {
  await startRaid({ fromBroadcasterId: fromId, toBroadcasterId: target.id });
  clearExpiry();
  setPending({ fromId, target, startedAt: Date.now() });
  expiry = setTimeout(() => setPending(null), RAID_DURATION_MS);
}

export async function cancel(fromId?: string): Promise<void> {
  const broadcasterId = fromId ?? pending()?.fromId;
  if (broadcasterId) await cancelRaid({ broadcasterId });
  clearExpiry();
  setPending(null);
}

export function shoutOutRaider(channelId: string, raiderId: string): void {
  if (!moderationAutoShoutoutOnRaid() || !hasPermission(channelId, "moderate"))
    return;
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
