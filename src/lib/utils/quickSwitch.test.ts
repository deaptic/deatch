import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import { userFromRef } from "./knownUsers.ts";
import { quickSwitchRows, uniqueUsers } from "./quickSwitch.ts";

const user = (id: string, login: string, displayName = login): User =>
  userFromRef({ id, login, displayName });

const maya = user("1", "maya", "Maya");
const zed = user("2", "zed_plays", "ZedPlays");

test("uniqueUsers keeps the first of each id and skips gaps", () => {
  expect(uniqueUsers([maya, null, zed, { ...maya }, undefined])).toStrictEqual([
    maya,
    zed,
  ]);
});

test("an empty query lists every candidate without a search row", () => {
  expect(quickSwitchRows([maya, zed], "  ")).toStrictEqual([
    { kind: "channel", user: maya },
    { kind: "channel", user: zed },
  ]);
});

test("a query matches login or display name and offers a search", () => {
  expect(quickSwitchRows([maya, zed], " ZedP ")).toStrictEqual([
    { kind: "channel", user: zed },
    { kind: "search", query: "zedp" },
  ]);
});

test("an exact login match needs no search row", () => {
  expect(quickSwitchRows([maya, zed], "Maya")).toStrictEqual([
    { kind: "channel", user: maya },
  ]);
});
