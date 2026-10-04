/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { User } from "../types/index.ts";
import {
  freshEntries,
  isComplete,
  isKnownUser,
  isUserId,
  mergeUser,
  requestsInWindow,
  sameUser,
} from "./knownUsers.ts";

const full: User = {
  id: "1",
  login: "maya",
  displayName: "Maya",
  profileImageUrl: "https://cdn/maya-300x300.png",
  description: "hi",
  broadcasterType: "affiliate",
  createdAt: "2020-01-01T00:00:00Z",
};

Deno.test("mergeUser lets a partial user only rename and fill gaps", () => {
  const partial: User = {
    ...full,
    displayName: "MAYA",
    profileImageUrl: "",
    description: "",
    broadcasterType: "normal",
    createdAt: "",
  };
  assertEquals(mergeUser(full, partial), { ...full, displayName: "MAYA" });
  assertEquals(
    mergeUser({ ...partial, profileImageUrl: "" }, {
      ...partial,
      profileImageUrl: "https://cdn/new.png",
    }).profileImageUrl,
    "https://cdn/new.png",
  );
});

Deno.test("mergeUser takes a complete user from Twitch as is", () => {
  const renamed = { ...full, login: "maya2", description: "" };
  assertEquals(mergeUser(full, renamed), renamed);
});

Deno.test("sameUser compares every field", () => {
  assertEquals(sameUser(full, { ...full }), true);
  assertEquals(sameUser(full, { ...full, description: "" }), false);
});

Deno.test("isComplete is true only for users Twitch has returned", () => {
  assertEquals(isComplete(full), true);
  assertEquals(isComplete({ ...full, createdAt: "" }), false);
});

Deno.test("isUserId accepts Twitch numeric ids only", () => {
  assertEquals(isUserId("52679773"), true);
  assertEquals(isUserId("maya"), false);
  assertEquals(isUserId(""), false);
});

Deno.test("isKnownUser rejects malformed stored entries", () => {
  assertEquals(isKnownUser({ user: full, at: 1 }), true);
  assertEquals(isKnownUser(null), false);
  assertEquals(isKnownUser({ user: null, at: 1 }), false);
  assertEquals(isKnownUser({ user: full }), false);
});

Deno.test("freshEntries drops expired entries and keeps the newest up to max", () => {
  const at = (n: number) => ({ user: full, at: n });
  const entries = { old: at(0), a: at(900), b: at(950), c: at(990) };
  assertEquals(Object.keys(freshEntries(entries, 1000, 500, 2)), ["c", "b"]);
});

Deno.test("freshEntries never drops kept ids", () => {
  const at = (n: number) => ({ user: full, at: n });
  const entries = { me: at(0), a: at(900), b: at(950), c: at(990) };
  assertEquals(
    Object.keys(freshEntries(entries, 1000, 500, 2, new Set(["me"]))),
    ["me", "c"],
  );
});

Deno.test("requestsInWindow keeps only requests inside the window", () => {
  assertEquals(requestsInWindow([0, 30_000, 59_000], 60_000, 60_000), [
    30_000,
    59_000,
  ]);
});
