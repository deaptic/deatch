import { createSignal } from "solid-js";
import type {
  AdSchedule,
  CharityCampaign,
  Goal,
  Poll,
  Prediction,
  UnbanRequest,
} from "../types/index.ts";

export type Activity = {
  poll: Poll | null;
  prediction: Prediction | null;
  shield: boolean;
  charity: CharityCampaign | null;
  unbanRequests: UnbanRequest[];
  goals: Goal[];
  ads: AdSchedule | null;
};

const NONE: Activity = {
  poll: null,
  prediction: null,
  shield: false,
  charity: null,
  unbanRequests: [],
  goals: [],
  ads: null,
};

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
