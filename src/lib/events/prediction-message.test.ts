/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawPrediction } from "../types/twitch/eventsub.ts";
import {
  predictionBegin,
  predictionEnd,
  predictionLock,
} from "./prediction-message.ts";

const prediction = (p: Partial<RawPrediction> = {}): RawPrediction => ({
  broadcaster_user_id: "1",
  id: "p1",
  title: "Win?",
  outcomes: [
    { id: "a", title: "Yes", users: 4, channel_points: 1000 },
    { id: "b", title: "No", users: 1, channel_points: 500 },
  ],
  started_at: "2026-10-01T00:00:00Z",
  locks_at: "2026-10-01T00:05:00Z",
  ...p,
});

Deno.test("describes the start and the locked stakes", () => {
  assertEquals(
    predictionBegin(prediction()),
    "Prediction started for 5m: Win? (Yes and No)",
  );
  assertEquals(
    predictionLock(prediction()),
    "Prediction locked: Win?. Yes 1,000 points from 4 viewers and No 500 points from 1 viewer",
  );
});

Deno.test("names the winner and the pot, or the refund", () => {
  assertEquals(
    predictionEnd(prediction({ status: "resolved", winning_outcome_id: "a" })),
    "Prediction resolved: Win?. Yes won, splitting 1,500 points between 4 viewers",
  );
  assertEquals(
    predictionEnd(prediction({ status: "canceled" })),
    "Prediction canceled: Win?. Points were refunded",
  );
});
