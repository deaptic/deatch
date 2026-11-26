import { expect, test } from "vite-plus/test";
import { readReport, readReward } from "./read.ts";

test("rewards from the page keep only checked fields", () => {
  expect(
    readReward({
      id: "reward1",
      title: "Hydrate",
      cost: 100,
      color: "#00FA05",
      input: "yes",
      status: "paused",
      perUserLimit: 2,
      redeemedThisStream: 0,
      subOnly: true,
      extra: "dropped",
    }),
  ).toEqual([
    {
      id: "reward1",
      title: "Hydrate",
      prompt: null,
      cost: 100,
      color: "#00FA05",
      image: null,
      input: false,
      status: "paused",
      cooldownEndsAt: null,
      perUserLimit: 2,
      redeemedThisStream: 0,
      subOnly: true,
    },
  ]);
  expect(
    readReward({
      id: "r",
      title: "T",
      cost: 1,
      status: "available",
      perUserLimit: 0,
    }),
  ).toMatchObject([{ perUserLimit: null }]);
  expect(readReward({ id: "reward1", title: "Hydrate", cost: 1.5 })).toEqual(
    [],
  );
  expect(readReward({ id: 1, title: "Hydrate", cost: 100 })).toEqual([]);
  expect(
    readReward({
      id: "reward1",
      title: "Hydrate",
      cost: 100,
      status: "on_fire",
    }),
  ).toEqual([]);
});

test("drop progress and earning keep only well-formed values", () => {
  expect(
    readReport({
      channel: "broadcaster1",
      balance: 1,
      drop: {
        game: "Game",
        watched: 16,
        required: 60,
        reward: "Cape",
        image: "https://static-cdn.jtvnw.net/cape.png",
      },
      earnedAt: { "24138907": "2026-11-26T19:13:04Z", bad: "x", "2": 5 },
    }),
  ).toMatchObject({
    drop: {
      game: "Game",
      watched: 16,
      required: 60,
      reward: "Cape",
      image: "https://static-cdn.jtvnw.net/cape.png",
    },
    earnedAt: { "24138907": "2026-11-26T19:13:04Z" },
  });
  expect(
    readReport({
      channel: "broadcaster1",
      balance: 1,
      drop: { game: "Game", watched: 16, required: 0 },
    }),
  ).toMatchObject({ drop: null });
});

test("points reports need a channel login and a whole balance", () => {
  expect(
    readReport({
      channel: "Broadcaster1",
      balance: 120,
      bonusReady: true,
      subscribed: true,
    }),
  ).toEqual({
    channel: "broadcaster1",
    balance: 120,
    bonusReady: true,
    subscribed: true,
    rewards: [],
    drop: null,
    earnedAt: {},
  });
  expect(
    readReport({ channel: "broadcaster1", balance: 1, subscribed: "yes" }),
  ).toMatchObject({ subscribed: null });
  expect(readReport({ channel: "directory", balance: 120 })).toBeNull();
  expect(readReport({ channel: "broadcaster1", balance: 1.5 })).toBeNull();
  expect(readReport({ channel: 7, balance: 120 })).toBeNull();
});

test("pictures load only from Twitch's image host over https", () => {
  const withImage = (image: string) =>
    readReward({ id: "r", title: "T", cost: 1, status: "available", image });
  expect(
    withImage("https://static-cdn.jtvnw.net/x/custom-2.png"),
  ).toMatchObject([{ image: "https://static-cdn.jtvnw.net/x/custom-2.png" }]);
  expect(withImage("http://static-cdn.jtvnw.net/x.png")).toMatchObject([
    { image: null },
  ]);
  expect(withImage("https://example.com/x.png")).toMatchObject([
    { image: null },
  ]);
  expect(withImage("not a url")).toMatchObject([{ image: null }]);
});

test("a channel without channel points reports no balance", () => {
  expect(readReport({ channel: "broadcaster1", balance: null })).toMatchObject({
    balance: null,
  });
  expect(readReport({ channel: "broadcaster1" })).toMatchObject({
    balance: null,
  });
});
