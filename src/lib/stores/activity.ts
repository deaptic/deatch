import { createSignal } from "solid-js";
import type { Poll, Prediction } from "../types/index.ts";

/// What is running in a channel right now, for the people who can steer it.
export type Activity = {
  poll: Poll | null;
  prediction: Prediction | null;
  shield: boolean;
};

const NONE: Activity = { poll: null, prediction: null, shield: false };

const [byChannel, setByChannel] = createSignal<Record<string, Activity>>({});

export function activityFor(broadcasterId: string): Activity {
  return byChannel()[broadcasterId] ?? NONE;
}

export function updateActivity(
  broadcasterId: string,
  change: Partial<Activity>,
) {
  setByChannel((prev) => ({
    ...prev,
    [broadcasterId]: { ...(prev[broadcasterId] ?? NONE), ...change },
  }));
}

export function clearActivity(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}
