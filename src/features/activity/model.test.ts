import { expect, test } from "vite-plus/test";
import {
  charityFrom,
  goalFrom,
  pollFrom,
  predictionFrom,
  unbanRequestFrom,
  withGoal,
  withoutUnbanRequest,
  withUnbanRequest,
} from "./model.ts";
import type {
  RawCharityCampaign,
  RawPoll,
  RawPrediction,
} from "../../lib/types/index.ts";

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

const campaign: RawCharityCampaign = {
  broadcaster_id: "1",
  id: "c1",
  charity_name: "Kind Org",
  current_amount: { value: 12000, decimal_places: 2, currency: "EUR" },
  target_amount: { value: 50000, decimal_places: 2, currency: "EUR" },
};

test("charityFrom keeps the raised and target amounts", () => {
  expect(charityFrom(campaign)).toEqual({
    charityName: "Kind Org",
    current: { value: 12000, decimalPlaces: 2, currency: "EUR" },
    target: { value: 50000, decimalPlaces: 2, currency: "EUR" },
  });
});

test("unbanRequestFrom keeps who asked, what they wrote and when", () => {
  expect(
    unbanRequestFrom({
      broadcaster_user_id: "1",
      id: "u1",
      user_id: "2",
      user_login: "viewer1",
      user_name: "Viewer1",
      text: "sorry",
      created_at: "2026-01-01T00:00:00Z",
    }),
  ).toEqual({
    id: "u1",
    user: { id: "2", login: "viewer1", displayName: "Viewer1" },
    text: "sorry",
    createdAt: "2026-01-01T00:00:00Z",
  });
});

test("an unban request is listed once and leaves when resolved", () => {
  const request = {
    id: "u1",
    user: { id: "2", login: "viewer1", displayName: "Viewer1" },
    text: "sorry",
    createdAt: "2026-01-01T00:00:00Z",
  };
  const listed = withUnbanRequest(withUnbanRequest([], request), request);
  expect(listed).toHaveLength(1);
  expect(withoutUnbanRequest(listed, "u1")).toEqual([]);
});

test("a goal keeps its place in the list as it progresses", () => {
  const raw = {
    broadcaster_user_id: "1",
    id: "g1",
    type: "new_bit",
    description: "New mic",
    current_amount: 100,
    target_amount: 1000,
  };
  const other = goalFrom({ ...raw, id: "g2" });
  const started = withGoal([goalFrom(raw), other], goalFrom(raw));
  const progressed = withGoal(
    started,
    goalFrom({ ...raw, current_amount: 400 }),
  );
  expect(progressed.map((g) => [g.id, g.current])).toEqual([
    ["g1", 400],
    ["g2", 100],
  ]);
  expect(progressed[0]?.kind).toBe("new_bit");
});
