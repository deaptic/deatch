import type { Activity } from "../stores/activity.ts";

const POLL_MS = 90_000;
const PREDICTION_MS = 120_000;
const HOUR_MS = 3_600_000;

const at = (ms: number) => new Date(ms).toISOString();

export function sampleActivity(now: number): Activity {
  return {
    shield: true,
    poll: {
      id: "sample-poll",
      title: "Which map next?",
      choices: [
        { id: "a", title: "Harbor", votes: 42 },
        { id: "b", title: "Canyon", votes: 17 },
        { id: "c", title: "Old Factory District", votes: 9 },
        { id: "d", title: "Rooftops", votes: 0 },
      ],
      endsAt: at(now + POLL_MS),
    },
    prediction: {
      id: "sample-prediction",
      title: "Win this round?",
      phase: { kind: "open", locksAt: at(now + PREDICTION_MS) },
      outcomes: [
        { id: "win", title: "Clean win", channelPoints: 12_000, users: 8 },
        { id: "close", title: "Close call", channelPoints: 6_200, users: 5 },
        { id: "loss", title: "Loss", channelPoints: 4_500, users: 3 },
      ],
    },
    charity: {
      charityName: "Kind Org",
      current: { value: 12_000, decimalPlaces: 2, currency: "EUR" },
      target: { value: 50_000, decimalPlaces: 2, currency: "EUR" },
    },
    unbanRequests: [
      {
        id: "sample-unban",
        user: { id: "0", login: "viewer1", displayName: "viewer1" },
        text: "Sorry, it won't happen again.",
        createdAt: at(now - HOUR_MS),
      },
    ],
    goals: [
      {
        id: "sample-goal-1",
        kind: "new_bit",
        description: "New mic",
        current: 420,
        target: 1000,
      },
      {
        id: "sample-goal-2",
        kind: "follow",
        description: "",
        current: 87,
        target: 100,
      },
    ],
  };
}
