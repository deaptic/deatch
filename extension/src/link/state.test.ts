import { expect, test } from "vite-plus/test";
import type { ChannelReport } from "../rewards/types.ts";
import { buildState, createPublisher } from "./state.ts";

const summary = {
  channels: [
    { login: "broadcaster1", muted: false },
    { login: "broadcaster2", muted: false },
  ],
  current: "broadcaster1",
};

const report = (change: Partial<ChannelReport>): ChannelReport => ({
  channel: "broadcaster1",
  balance: null,
  bonusReady: false,
  subscribed: null,
  rewards: [],
  drop: null,
  earnedAt: {},
  ...change,
});

const reports = new Map<string, ChannelReport>([
  [
    "broadcaster1",
    report({
      balance: 50,
      bonusReady: true,
      subscribed: true,
      drop: {
        game: "Game",
        watched: 16,
        required: 60,
        reward: "Cape",
        image: null,
      },
      earnedAt: { "1": "2026-11-26T19:13:04Z", "2": "2026-11-26T19:00:00Z" },
    }),
  ],
  [
    "broadcaster2",
    report({
      channel: "broadcaster2",
      earnedAt: { "2": "2026-11-26T19:10:00Z" },
    }),
  ],
  [
    "closed",
    report({
      channel: "closed",
      balance: 9,
      bonusReady: true,
      subscribed: false,
      earnedAt: { "3": "2026-11-26T19:20:00Z" },
    }),
  ],
]);

const build = (change: Partial<Parameters<typeof buildState>[0]> = {}) =>
  buildState({
    summary,
    reports,
    gains: {},
    compressorOn: null,
    autoClaim: false,
    ...change,
  });

test("reports count only for open channels, and a missing balance is left out", () => {
  const state = build();
  expect(state.balances).toEqual({ broadcaster1: 50 });
  expect(state.bonusReady).toEqual(["broadcaster1"]);
  expect(state.rewards).toEqual({ broadcaster1: [], broadcaster2: [] });
  expect(state.drops).toEqual({
    broadcaster1: {
      game: "Game",
      watched: 16,
      required: 60,
      reward: "Cape",
      image: null,
    },
  });
  expect(state.earnedAt).toEqual({
    "1": "2026-11-26T19:13:04Z",
    "2": "2026-11-26T19:10:00Z",
  });
  expect(state.subscribed).toEqual({ broadcaster1: true });
});

test("no bonus is ready while the extension claims on its own", () => {
  expect(build({ autoClaim: true }).bonusReady).toEqual([]);
});

test("volumes are left out while gain control is off", () => {
  expect(build({ gains: null }).gains).toBeNull();
});

test("the compressor is reported only while its feature is on", () => {
  expect(build({ compressorOn: true }).compressorOn).toBe(true);
  expect(build({ compressorOn: null }).compressorOn).toBeNull();
});

test("an unchanged state is sent once, and again after a reset", () => {
  const sent: unknown[] = [];
  const publisher = createPublisher((state: unknown) => sent.push(state) > 0);
  publisher.publish({ a: 1 });
  publisher.publish({ a: 1 });
  publisher.reset();
  publisher.publish({ a: 1 });
  expect(sent).toHaveLength(2);
});
