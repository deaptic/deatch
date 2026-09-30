import { cancelRaid, startRaid } from "../api/twitch/raids.ts";
import {
  pendingRaid,
  RAID_DURATION_MS,
  type RaidTarget,
  setPendingRaid,
} from "../stores/raid.ts";

export class RaidManager {
  private timer: ReturnType<typeof setTimeout> | undefined;

  public async begin(fromId: string, target: RaidTarget): Promise<void> {
    await startRaid({ fromBroadcasterId: fromId, toBroadcasterId: target.id });
    this.clearTimer();
    setPendingRaid({ fromId, target, startedAt: Date.now() });
    this.timer = setTimeout(() => setPendingRaid(null), RAID_DURATION_MS);
  }

  public async cancel(fromId?: string): Promise<void> {
    const broadcasterId = fromId ?? pendingRaid()?.fromId;
    this.clearTimer();
    setPendingRaid(null);
    if (broadcasterId) await cancelRaid({ broadcasterId }).catch(() => {});
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}

export const raidManager = new RaidManager();
