import { expect, test } from "vite-plus/test";
import { snapshot } from "./snapshot.ts";

const reward = (extra: object) => ({
  id: "reward1",
  title: "Hydrate",
  cost: 100,
  isEnabled: true,
  pricingType: "POINTS",
  ...extra,
});

test("only enabled point rewards are reported, with their status", () => {
  const result = snapshot(
    "broadcaster1",
    {
      channelLogin: "Broadcaster1",
      channelID: "1",
      userRedemptions: [
        { reward: { id: "reward1" }, userRedemptionsCurrentStream: 3 },
      ],
      balance: 500,
      customRewards: [
        reward({
          isPaused: true,
          backgroundColor: "#00FA05",
          maxPerUserPerStreamSetting: {
            isEnabled: true,
            maxPerUserPerStream: 1,
          },
        }),
        reward({ id: "off", isEnabled: false }),
        reward({ id: "bits", pricingType: "BITS" }),
        reward({
          id: "gone",
          isInStock: false,
          isSubOnly: true,
          maxPerUserPerStreamSetting: {
            isEnabled: false,
            maxPerUserPerStream: 5,
          },
        }),
      ],
    },
    { bonusReady: false, subscribed: true, drop: null, earnedAt: {} },
  );
  expect(result.channel).toBe("broadcaster1");
  expect(result.subscribed).toBe(true);
  expect(
    result.rewards.map((r) => [
      r.id,
      r.status,
      r.color,
      r.perUserLimit,
      r.redeemedThisStream,
      r.subOnly,
    ]),
  ).toEqual([
    ["reward1", "paused", "#00FA05", 1, 3, false],
    ["gone", "sold_out", null, null, null, true],
  ]);
});

test("a channel without channel points still reports its drop", () => {
  const drop = {
    game: "Game",
    watched: 1,
    required: 60,
    reward: null,
    image: null,
  };
  expect(
    snapshot("broadcaster1", null, {
      bonusReady: false,
      subscribed: null,
      drop,
      earnedAt: {},
    }),
  ).toEqual({
    channel: "broadcaster1",
    balance: null,
    bonusReady: false,
    subscribed: null,
    rewards: [],
    drop,
    earnedAt: {},
  });
});
