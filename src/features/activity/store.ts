import { createSignal } from "solid-js";
import { hasPermission, type Capability } from "../permissions/index.ts";
import {
  endPoll as endPollRequest,
  getActivePoll,
} from "../../platform/twitch/polls.ts";
import {
  endPrediction as endPredictionRequest,
  getActivePrediction,
} from "../../platform/twitch/predictions.ts";
import type {
  AdSchedule,
  CharityCampaign,
  Goal,
  Poll,
  Prediction,
  PredictionEnd,
  UnbanDecision,
  UnbanRequest,
} from "../../lib/types/index.ts";
import { getCharityCampaign } from "../../platform/twitch/charity.ts";
import { getGoals } from "../../platform/twitch/goals.ts";
import { getAdSchedule, snoozeNextAd } from "../../platform/twitch/ads.ts";
import {
  getShieldMode,
  getUnbanRequests,
  resolveUnbanRequest,
  updateShieldMode,
} from "../../platform/twitch/moderation.ts";
import { withoutUnbanRequest } from "./model.ts";

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

export function forChannel(broadcasterId: string): Activity {
  return byChannel()[broadcasterId] ?? NONE;
}

export function update(broadcasterId: string, change: Partial<Activity>) {
  setByChannel((prev) => ({
    ...prev,
    [broadcasterId]: { ...(prev[broadcasterId] ?? NONE), ...change },
  }));
}

export function clear(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}

type Source = {
  capability: Capability;
  load: (broadcasterId: string) => Promise<Partial<Activity>>;
};

const silent = { silent: true };
const of = (broadcasterId: string) => ({ broadcasterId });

const SOURCES = {
  shield: {
    capability: "moderate",
    load: (id) => getShieldMode(of(id), silent).then((shield) => ({ shield })),
  },
  unbans: {
    capability: "moderate",
    load: (id) =>
      getUnbanRequests(of(id), silent).then((unbanRequests) => ({
        unbanRequests,
      })),
  },
  poll: {
    capability: "manageStream",
    load: (id) => getActivePoll(of(id), silent).then((poll) => ({ poll })),
  },
  prediction: {
    capability: "manageStream",
    load: (id) =>
      getActivePrediction(of(id), silent).then((prediction) => ({
        prediction,
      })),
  },
  charity: {
    capability: "manageStream",
    load: (id) =>
      getCharityCampaign(of(id), silent).then((charity) => ({ charity })),
  },
  goals: {
    capability: "manageStream",
    load: (id) => getGoals(of(id), silent).then((goals) => ({ goals })),
  },
  ads: {
    capability: "manageStream",
    load: (id) => getAdSchedule(of(id), silent).then((ads) => ({ ads })),
  },
} satisfies Record<string, Source>;

type SourceName = keyof typeof SOURCES;

function refresh(broadcasterId: string, name: SourceName): void {
  const source: Source = SOURCES[name];
  if (!hasPermission(broadcasterId, source.capability)) return;
  source
    .load(broadcasterId)
    .then((change) => update(broadcasterId, change))
    .catch(() => {});
}

export function load(broadcasterId: string): void {
  for (const name of Object.keys(SOURCES) as SourceName[]) {
    refresh(broadcasterId, name);
  }
}

export function endPoll(broadcasterId: string, pollId: string): void {
  endPollRequest({ broadcasterId, pollId })
    .then(() => update(broadcasterId, { poll: null }))
    .catch(() => {});
}

export function endPrediction(
  broadcasterId: string,
  prediction: Prediction,
  end: PredictionEnd,
): void {
  endPredictionRequest({ broadcasterId, predictionId: prediction.id, end })
    .then(() =>
      update(broadcasterId, {
        prediction:
          end.kind === "lock"
            ? { ...prediction, phase: { kind: "locked" } }
            : null,
      }),
    )
    .catch(() => {});
}

export function setShield(broadcasterId: string, active: boolean): void {
  updateShieldMode({ broadcasterId, active })
    .then((shield) => update(broadcasterId, { shield }))
    .catch(() => {});
}

export async function resolveUnban(
  broadcasterId: string,
  requestId: string,
  decision: UnbanDecision,
  note: string,
): Promise<void> {
  await resolveUnbanRequest({ broadcasterId, requestId, decision, note });
  update(broadcasterId, {
    unbanRequests: withoutUnbanRequest(
      forChannel(broadcasterId).unbanRequests,
      requestId,
    ),
  });
}

export function refreshAds(broadcasterId: string): void {
  refresh(broadcasterId, "ads");
}

export function snoozeAd(broadcasterId: string): void {
  snoozeNextAd({ broadcasterId })
    .then(() => refreshAds(broadcasterId))
    .catch(() => {});
}
