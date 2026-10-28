import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import {
  freshEntries,
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
  expect(mergeUser(full, partial, false)).toStrictEqual({
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
      false,
    ).profileImageUrl,
  ).toBe("https://cdn/new.png");
});

test("mergeUser takes a whole user from Twitch as is", () => {
  const renamed = { ...full, login: "maya2", description: "" };
  expect(mergeUser(full, renamed, true)).toStrictEqual(renamed);
});

test("sameUser compares every field", () => {
  expect(sameUser(full, { ...full })).toBe(true);
  expect(sameUser(full, { ...full, description: "" })).toBe(false);
});

test("sameUser sees fields the cached user never had", () => {
  const { offlineImageUrl: _, ...older } = full;
  expect(sameUser(older as User, { ...full, offlineImageUrl: "x" })).toBe(
    false,
  );
});

test("isUserId accepts Twitch numeric ids only", () => {
  expect(isUserId("52679773")).toBe(true);
  expect(isUserId("maya")).toBe(false);
  expect(isUserId("")).toBe(false);
});

test("isKnownUser rejects malformed stored entries", () => {
  expect(isKnownUser({ user: full, fetchedAt: 1 })).toBe(true);
  expect(isKnownUser({ user: full, fetchedAt: null })).toBe(true);
  expect(isKnownUser(null)).toBe(false);
  expect(isKnownUser({ user: null, fetchedAt: 1 })).toBe(false);
  expect(isKnownUser({ user: full })).toBe(false);
  expect(isKnownUser({ user: full, at: 1 })).toBe(false);
});

test("freshEntries drops expired entries and keeps the newest up to max", () => {
  const at = (n: number | null) => ({ user: full, fetchedAt: n });
  const entries = {
    old: at(0),
    partial: at(null),
    a: at(900),
    b: at(950),
    c: at(990),
  };
  expect(Object.keys(freshEntries(entries, 1000, 500, 2))).toStrictEqual([
    "c",
    "b",
  ]);
});

test("freshEntries never drops kept ids", () => {
  const at = (n: number | null) => ({ user: full, fetchedAt: n });
  const entries = { me: at(null), a: at(900), b: at(950), c: at(990) };
  expect(
    Object.keys(freshEntries(entries, 1000, 500, 2, new Set(["me"]))),
  ).toStrictEqual(["me", "c"]);
});
