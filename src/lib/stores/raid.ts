import { createSignal } from "solid-js";
import type { UserRef } from "../types/index.ts";

export const RAID_DURATION_MS = 90_000;

export type PendingRaid = {
  fromId: string;
  target: UserRef;
  startedAt: number;
};

export const [pendingRaid, setPendingRaid] = createSignal<PendingRaid | null>(
  null,
);
