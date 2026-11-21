import { expect, test } from "vite-plus/test";
import type { SearchChannel } from "../types/index.ts";
import { rankChannels } from "./channelRank.ts";

const channel = (login: string, displayName = login) =>
  ({ user: { id: login, login, displayName } }) as SearchChannel;

const logins = (list: SearchChannel[]) => list.map((c) => c.user.login);

test("puts the exact match first, then prefixes, then other matches", () => {
  const found = [
    channel("formatica_a"),
    channel("xforsuticx"),
    channel("forsutic_fan"),
    channel("forsutic", "Forsutic"),
    channel("unrelated"),
  ];
  expect(logins(rankChannels(" ForSutic ", found))).toStrictEqual([
    "forsutic",
    "forsutic_fan",
    "xforsuticx",
    "unrelated",
    "formatica_a",
  ]);
});

test("matches display names; within a rank, shorter then A to Z", () => {
  const found = [
    channel("forsutinus"),
    channel("zz", "Teo"),
    channel("forsutic"),
    channel("forsutia"),
  ];
  expect(logins(rankChannels("forsuti", found))).toStrictEqual([
    "forsutia",
    "forsutic",
    "forsutinus",
    "zz",
  ]);
  expect(logins(rankChannels("teo", found))[0]).toBe("zz");
});
