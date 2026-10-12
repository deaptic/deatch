import { createSignal } from "solid-js";

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

export const [pendingRaid, setPendingRaid] = createSignal<PendingRaid | null>(
  null,
);
