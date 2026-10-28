import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import {
  freshEntries,
  isComplete,
  isKnownUser,
  isUserId,
  mergeUser,
  sameUser,
} from "./knownUsers.ts";

const full: User = {
  id: "1",
  login: "maya",
  displayName: "Maya",
  profileImageUrl: "https://cdn/maya-300x300.png",
  offlineImageUrl: null,
  description: "hi",
  broadcasterType: "affiliate",
  createdAt: "2020-01-01T00:00:00Z",
};

test("mergeUser lets a partial user only rename and fill gaps", () => {
  const partial: User = {
    ...full,
    displayName: "MAYA",
    profileImageUrl: "",
    description: "",
    broadcasterType: "normal",
    createdAt: "",
  };
  expect(mergeUser(full, partial)).toStrictEqual({
    ...full,
    displayName: "MAYA",
  });
  expect(
    mergeUser(
      { ...partial, profileImageUrl: "" },
      {
        ...partial,
        profileImageUrl: "https://cdn/new.png",
      },
    ).profileImageUrl,
  ).toStrictEqual("https://cdn/new.png");
});

test("mergeUser takes a complete user from Twitch as is", () => {
  const renamed = { ...full, login: "maya2", description: "" };
  expect(mergeUser(full, renamed)).toStrictEqual(renamed);
});

test("sameUser compares every field", () => {
  expect(sameUser(full, { ...full })).toStrictEqual(true);
  expect(sameUser(full, { ...full, description: "" })).toStrictEqual(false);
});

test("sameUser sees fields the cached user never had", () => {
  const { offlineImageUrl: _, ...older } = full;
  expect(
    sameUser(older as User, { ...full, offlineImageUrl: "x" }),
  ).toStrictEqual(false);
});

test("isComplete is true only for users Twitch has returned", () => {
  expect(isComplete(full)).toStrictEqual(true);
  expect(isComplete({ ...full, createdAt: "" })).toStrictEqual(false);
});

test("isUserId accepts Twitch numeric ids only", () => {
  expect(isUserId("52679773")).toStrictEqual(true);
  expect(isUserId("maya")).toStrictEqual(false);
  expect(isUserId("")).toStrictEqual(false);
});

test("isKnownUser rejects malformed stored entries", () => {
  expect(isKnownUser({ user: full, at: 1 })).toStrictEqual(true);
  expect(isKnownUser(null)).toStrictEqual(false);
  expect(isKnownUser({ user: null, at: 1 })).toStrictEqual(false);
  expect(isKnownUser({ user: full })).toStrictEqual(false);
});

test("freshEntries drops expired entries and keeps the newest up to max", () => {
  const at = (n: number) => ({ user: full, at: n });
  const entries = { old: at(0), a: at(900), b: at(950), c: at(990) };
  expect(Object.keys(freshEntries(entries, 1000, 500, 2))).toStrictEqual([
    "c",
    "b",
  ]);
});

test("freshEntries never drops kept ids", () => {
  const at = (n: number) => ({ user: full, at: n });
  const entries = { me: at(0), a: at(900), b: at(950), c: at(990) };
  expect(
    Object.keys(freshEntries(entries, 1000, 500, 2, new Set(["me"]))),
  ).toStrictEqual(["me", "c"]);
});
