import { expect, test } from "vite-plus/test";
import { rewardBlock, type Viewer } from "./rewards.ts";
import type { LinkReward } from "../../shared/types/index.ts";

const NOW = Date.parse("2026-11-26T12:00:00Z");

const reward = (change: Partial<LinkReward> = {}): LinkReward => ({
  id: "reward1",
  title: "Hydrate",
  prompt: null,
  cost: 100,
  color: null,
  image: null,
  input: false,
  status: "available",
  cooldownEndsAt: null,
  perUserLimit: null,
  redeemedThisStream: null,
  subOnly: false,
  ...change,
});

const viewer = (change: Partial<Viewer> = {}): Viewer => ({
  balance: 100,
  subscribed: null,
  ...change,
});

test("an affordable available reward is not blocked", () => {
  expect(rewardBlock(reward(), viewer({ balance: 100 }), NOW)).toBeNull();
});

test("the streamer's status wins over cooldown and price", () => {
  expect(
    rewardBlock(
      reward({ status: "sold_out", cooldownEndsAt: "2026-11-26T12:05:00Z" }),
      viewer({ balance: 0 }),
      NOW,
    ),
  ).toEqual({ kind: "status", status: "sold_out" });
});

test("a running cooldown reports the seconds left, a finished one is ignored", () => {
  expect(
    rewardBlock(
      reward({ cooldownEndsAt: "2026-11-26T12:01:30Z" }),
      viewer({ balance: 100 }),
      NOW,
    ),
  ).toEqual({ kind: "cooldown", seconds: 90 });
  expect(
    rewardBlock(
      reward({ cooldownEndsAt: "2026-11-26T11:59:00Z" }),
      viewer({ balance: 100 }),
      NOW,
    ),
  ).toBeNull();
});

test("too few points blocks last", () => {
  expect(rewardBlock(reward(), viewer({ balance: 99 }), NOW)).toEqual({
    kind: "price",
  });
});

test("the per-user limit blocks once Twitch counts that many redeems", () => {
  const limited = (redeemedThisStream: number) =>
    reward({ perUserLimit: 2, redeemedThisStream });
  expect(rewardBlock(limited(1), viewer(), NOW)).toBeNull();
  expect(rewardBlock(limited(2), viewer(), NOW)).toEqual({ kind: "limit" });
  expect(
    rewardBlock(reward({ redeemedThisStream: 50 }), viewer(), NOW),
  ).toBeNull();
});

test("sub-only rewards block only viewers known not to be subscribed", () => {
  const subOnly = reward({ subOnly: true });
  expect(rewardBlock(subOnly, viewer({ subscribed: false }), NOW)).toEqual({
    kind: "subOnly",
  });
  expect(rewardBlock(subOnly, viewer({ subscribed: true }), NOW)).toBeNull();
  expect(rewardBlock(subOnly, viewer(), NOW)).toBeNull();
});
