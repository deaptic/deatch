import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import { userFromRef } from "./knownUsers.ts";
import { matchesWords, quickSwitchRows, uniqueUsers } from "./quickSwitch.ts";

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
  expect(quickSwitchRows([viewer1, viewer2], [], "  ")).toStrictEqual([
    { kind: "channel", user: viewer1 },
    { kind: "channel", user: viewer2 },
  ]);
});

test("a query matches login or display name and offers a search", () => {
  expect(quickSwitchRows([viewer1, viewer2], [], " Viewer2P ")).toStrictEqual([
    { kind: "channel", user: viewer2 },
    { kind: "search", query: "viewer2p" },
  ]);
});

test("an exact login match needs no search row", () => {
  expect(quickSwitchRows([viewer1, viewer2], [], "Viewer1")).toStrictEqual([
    { kind: "channel", user: viewer1 },
  ]);
});

const slow = { label: "Slow mode 30 seconds" };
const poll = { label: "Start a poll" };

test("every query word must appear in an action label, in any order", () => {
  expect(matchesWords("Slow mode 30 seconds", "30 slow")).toBe(true);
  expect(matchesWords("Slow mode 30 seconds", "slow 60")).toBe(false);
});

test("actions only show for a typed query, after channels and before search", () => {
  expect(quickSwitchRows([viewer1], [slow, poll], "")).toStrictEqual([
    { kind: "channel", user: viewer1 },
  ]);
  expect(quickSwitchRows([viewer1], [slow, poll], "poll")).toStrictEqual([
    { kind: "action", action: poll },
    { kind: "search", query: "poll" },
  ]);
});
