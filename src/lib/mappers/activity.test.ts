import { expect, test } from "vite-plus/test";
import { pollFrom, predictionFrom } from "./activity.ts";
import type { RawPoll, RawPrediction } from "../types/index.ts";

const poll: RawPoll = {
  broadcaster_user_id: "1",
  id: "p1",
  title: "Best map?",
  choices: [
    { id: "a", title: "Dust", votes: 4 },
    { id: "b", title: "Inferno" },
  ],
  started_at: "2026-01-01T00:00:00Z",
  ends_at: "2026-01-01T00:02:00Z",
};

test("pollFrom keeps choices in order and counts missing votes as zero", () => {
  expect(pollFrom(poll)).toEqual({
    id: "p1",
    title: "Best map?",
    choices: [
      { id: "a", title: "Dust", votes: 4 },
      { id: "b", title: "Inferno", votes: 0 },
    ],
    endsAt: "2026-01-01T00:02:00Z",
  });
});

const prediction: RawPrediction = {
  broadcaster_user_id: "1",
  id: "r1",
  title: "Win?",
  outcomes: [
    { id: "y", title: "Yes", users: 2, channel_points: 500 },
    { id: "n", title: "No" },
  ],
  started_at: "2026-01-01T00:00:00Z",
  locks_at: "2026-01-01T00:05:00Z",
};

test("predictionFrom is open until voting locks", () => {
  expect(predictionFrom(prediction)).toEqual({
    id: "r1",
    title: "Win?",
    phase: { kind: "open", locksAt: "2026-01-01T00:05:00Z" },
    outcomes: [
      { id: "y", title: "Yes", channelPoints: 500, users: 2 },
      { id: "n", title: "No", channelPoints: 0, users: 0 },
    ],
  });
});

test("predictionFrom is locked once the lock stage drops locks_at", () => {
  const { locks_at: _, ...locked } = prediction;
  expect(predictionFrom(locked).phase).toEqual({ kind: "locked" });
});
