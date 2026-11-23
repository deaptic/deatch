import { expect, test } from "vite-plus/test";
import type { SearchChannel } from "../../shared/types/index.ts";
import { rankChannels } from "./rank.ts";

const channel = (login: string, displayName = login) =>
  ({ user: { id: login, login, displayName } }) as SearchChannel;

const logins = (list: SearchChannel[]) => list.map((c) => c.user.login);

test("puts the exact match first, then prefixes, then other matches", () => {
  const found = [
    channel("viewing_all"),
    channel("xviewerx"),
    channel("viewer_fan"),
    channel("viewer", "Viewer"),
    channel("unrelated"),
  ];
  expect(logins(rankChannels(" ViEwer ", found))).toStrictEqual([
    "viewer",
    "viewer_fan",
    "xviewerx",
    "unrelated",
    "viewing_all",
  ]);
});

test("matches display names; within a rank, shorter then A to Z", () => {
  const found = [
    channel("viewer_long"),
    channel("zz", "Broadcaster"),
    channel("viewer_b"),
    channel("viewer_a"),
  ];
  expect(logins(rankChannels("viewer", found))).toStrictEqual([
    "viewer_a",
    "viewer_b",
    "viewer_long",
    "zz",
  ]);
  expect(logins(rankChannels("broadcaster", found))[0]).toBe("zz");
});
