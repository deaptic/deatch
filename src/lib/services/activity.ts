import {
  endPoll as endPollRequest,
  getActivePoll,
} from "../api/twitch/polls.ts";
import {
  endPrediction as endPredictionRequest,
  getActivePrediction,
} from "../api/twitch/predictions.ts";
import type {
  Prediction,
  PredictionEnd,
  UnbanDecision,
} from "../types/index.ts";
import { getCharityCampaign } from "../api/twitch/charity.ts";
import { getGoals } from "../api/twitch/goals.ts";
import { getAdSchedule, snoozeNextAd } from "../api/twitch/ads.ts";
import {
  getShieldMode,
  getUnbanRequests,
  resolveUnbanRequest,
  updateShieldMode,
} from "../api/twitch/moderation.ts";
import {
  activityFor,
  clearActivity,
  updateActivity,
} from "../stores/activity.ts";
import { sampleActivity } from "../utils/sampleActivity.ts";
import * as clock from "./clock.ts";
import { withoutUnbanRequest } from "../mappers/activity.ts";

export function load(broadcasterId: string, isBroadcaster: boolean): void {
  const params = { broadcasterId };
  const silent = { silent: true };
  getShieldMode(params, silent)
    .then((shield) => updateActivity(broadcasterId, { shield }))
    .catch(() => {});
  getUnbanRequests(params, silent)
    .then((unbanRequests) => updateActivity(broadcasterId, { unbanRequests }))
    .catch(() => {});
  if (!isBroadcaster) return;
  getActivePoll(params, silent)
    .then((poll) => updateActivity(broadcasterId, { poll }))
    .catch(() => {});
  getActivePrediction(params, silent)
    .then((prediction) => updateActivity(broadcasterId, { prediction }))
    .catch(() => {});
  getCharityCampaign(params, silent)
    .then((charity) => updateActivity(broadcasterId, { charity }))
    .catch(() => {});
  getGoals(params, silent)
    .then((goals) => updateActivity(broadcasterId, { goals }))
    .catch(() => {});
  refreshAds(broadcasterId);
}

export function endPoll(broadcasterId: string, pollId: string): void {
  endPollRequest({ broadcasterId, pollId })
    .then(() => updateActivity(broadcasterId, { poll: null }))
    .catch(() => {});
}

export function endPrediction(
  broadcasterId: string,
  prediction: Prediction,
  end: PredictionEnd,
): void {
  endPredictionRequest({ broadcasterId, predictionId: prediction.id, end })
    .then(() =>
      updateActivity(broadcasterId, {
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
    .then((shield) => updateActivity(broadcasterId, { shield }))
    .catch(() => {});
}

export async function resolveUnban(
  broadcasterId: string,
  requestId: string,
  decision: UnbanDecision,
  note: string,
): Promise<void> {
  await resolveUnbanRequest({ broadcasterId, requestId, decision, note });
  updateActivity(broadcasterId, {
    unbanRequests: withoutUnbanRequest(
      activityFor(broadcasterId).unbanRequests,
      requestId,
    ),
  });
}

export function showSample(broadcasterId: string): void {
  updateActivity(broadcasterId, sampleActivity(clock.now()));
}

export function reset(broadcasterId: string, isBroadcaster: boolean): void {
  clearActivity(broadcasterId);
  load(broadcasterId, isBroadcaster);
}

export function refreshAds(broadcasterId: string): void {
  getAdSchedule({ broadcasterId }, { silent: true })
    .then((ads) => updateActivity(broadcasterId, { ads }))
    .catch(() => {});
}

export function snoozeAd(broadcasterId: string): void {
  snoozeNextAd({ broadcasterId })
    .then(() => refreshAds(broadcasterId))
    .catch(() => {});
}
