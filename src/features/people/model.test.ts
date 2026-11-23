import { expect, test } from "vite-plus/test";
import { groupChatters } from "./model.ts";

const user = (id: string, login: string) => ({
  id,
  login,
  displayName: login,
});

const roles = {
  broadcasterId: "1",
  moderators: new Set(["2"]),
  vips: new Set(["3"]),
};

const chatters = [
  user("4", "viewer2"),
  user("3", "viewer1"),
  user("1", "broadcaster"),
  user("2", "someone"),
  user("5", "viewer3"),
];

test("groups chatters by role in a fixed order, sorted by name", () => {
  expect(
    groupChatters(chatters, roles, "").map((g) => [
      g.kind,
      g.users.map((u) => u.login),
    ]),
  ).toEqual([
    ["broadcaster", ["broadcaster"]],
    ["moderators", ["someone"]],
    ["vips", ["viewer1"]],
    ["viewers", ["viewer2", "viewer3"]],
  ]);
});

test("search keeps matching chatters and drops empty groups", () => {
  expect(
    groupChatters(chatters, roles, " VIEWER3 ").map((g) => [
      g.kind,
      g.users.map((u) => u.login),
    ]),
  ).toEqual([["viewers", ["viewer3"]]]);
});
