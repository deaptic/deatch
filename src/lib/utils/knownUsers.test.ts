/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { User } from "../types/index.ts";
import {
  freshEntries,
  isComplete,
  mergeUser,
  requestsInWindow,
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

Deno.test("mergeUser takes the update when nothing is known yet", () => {
  assertEquals(mergeUser(undefined, full), full);
});

Deno.test("isComplete is true only for users Twitch has returned", () => {
  assertEquals(isComplete(full), true);
  assertEquals(isComplete({ ...full, createdAt: "" }), false);
});

Deno.test("freshEntries drops expired entries and keeps the newest up to max", () => {
  const at = (n: number) => ({ user: full, at: n });
  const entries = { old: at(0), a: at(900), b: at(950), c: at(990) };
  assertEquals(Object.keys(freshEntries(entries, 1000, 500, 2)), ["c", "b"]);
});

Deno.test("requestsInWindow keeps only requests inside the window", () => {
  assertEquals(requestsInWindow([0, 30_000, 59_000], 60_000, 60_000), [
    30_000,
    59_000,
  ]);
});
