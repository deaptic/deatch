import { createSignal } from "solid-js";
import { cancelRaid, startRaid } from "../api/twitch/raids.ts";

export const RAID_DURATION_MS = 90_000;

export type RaidTarget = {
  id: string;
  login: string;
  displayName: string;
};

export type PendingRaid = {
  fromId: string;
  target: RaidTarget;
  startedAt: number;
};

const [pendingRaid, setPendingRaid] = createSignal<PendingRaid | null>(null);
export { pendingRaid };

let timer: ReturnType<typeof setTimeout> | undefined;
function clearTimer() {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}

export async function beginRaid(fromId: string, target: RaidTarget) {
  await startRaid({ fromBroadcasterId: fromId, toBroadcasterId: target.id });
  clearTimer();
  setPendingRaid({ fromId, target, startedAt: Date.now() });
  timer = setTimeout(() => setPendingRaid(null), RAID_DURATION_MS);
}

export async function cancelActiveRaid(fromId?: string) {
  const broadcasterId = fromId ?? pendingRaid()?.fromId;
  clearTimer();
  setPendingRaid(null);
  if (broadcasterId) await cancelRaid({ broadcasterId }).catch(() => {});
}
