import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import { userFromRef } from "./knownUsers.ts";
import { quickSwitchRows, uniqueUsers } from "./quickSwitch.ts";

const user = (id: string, login: string, displayName = login): User =>
  userFromRef({ id, login, displayName });

const viewer1 = user("1", "viewer1", "Viewer1");
const viewer2 = user("2", "viewer2_plays", "Viewer2Plays");

test("uniqueUsers keeps the first of each id and skips gaps", () => {
  expect(
    uniqueUsers([viewer1, null, viewer2, { ...viewer1 }, undefined]),
  ).toStrictEqual([viewer1, viewer2]);
});

test("an empty query lists every candidate without a search row", () => {
  expect(quickSwitchRows([viewer1, viewer2], "  ")).toStrictEqual([
    { kind: "channel", user: viewer1 },
    { kind: "channel", user: viewer2 },
  ]);
});

test("a query matches login or display name and offers a search", () => {
  expect(quickSwitchRows([viewer1, viewer2], " Viewer2P ")).toStrictEqual([
    { kind: "channel", user: viewer2 },
    { kind: "search", query: "viewer2p" },
  ]);
});

test("an exact login match needs no search row", () => {
  expect(quickSwitchRows([viewer1, viewer2], "Viewer1")).toStrictEqual([
    { kind: "channel", user: viewer1 },
  ]);
});
