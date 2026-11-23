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
import {
  getShieldMode,
  getUnbanRequests,
  resolveUnbanRequest,
  updateShieldMode,
} from "../api/twitch/moderation.ts";
import { activityFor, updateActivity } from "../stores/activity.ts";
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
