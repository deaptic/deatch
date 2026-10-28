import { expect, test } from "vite-plus/test";
import type { RawPrediction } from "../types/index.ts";
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

test("describes the start and the locked stakes", () => {
  expect(predictionBegin(prediction())).toStrictEqual({
    text: "Prediction “Win?” started for 5m",
    detail: "Outcomes: Yes and No",
  });
  expect(predictionLock(prediction())).toStrictEqual({
    text: "Prediction “Win?” locked",
    detail: "Yes 1,000 points from 4 viewers and No 500 points from 1 viewer",
  });
});

test("names the winner and the pot, or the refund", () => {
  expect(
    predictionEnd(prediction({ status: "resolved", winning_outcome_id: "a" })),
  ).toStrictEqual({
    text: "Prediction “Win?” resolved: Yes won",
    detail: "1,500 points split between 4 viewers",
  });
  expect(predictionEnd(prediction({ status: "canceled" }))).toStrictEqual({
    text: "Prediction “Win?” was canceled and points were refunded",
  });
});
