import { expect, test } from "vite-plus/test";
import { rankSuggestions } from "./rankSuggestions.ts";

const names = ["zbar", "barz", "abar", "bar", "qux"];
const byName = {
  keys: (name: string) => [name],
  compare: (a: string, b: string) => a.localeCompare(b),
};

test("ranks prefix matches before substring matches, each sorted", () => {
  expect(rankSuggestions(names, "bar", byName)).toStrictEqual([
    "bar",
    "barz",
    "abar",
    "zbar",
  ]);
});

test("an exact match wins over a better-sorted prefix match", () => {
  const ranked = rankSuggestions(["viewer10", "viewer1"], "viewer1", {
    keys: (name) => [name],
    compare: (a, b) => b.length - a.length,
  });
  expect(ranked).toStrictEqual(["viewer1", "viewer10"]);
});

test("matches the query case-insensitively", () => {
  expect(rankSuggestions(names, "BAR", byName)[0]).toBe("bar");
});

test("returns everything sorted for an empty query", () => {
  expect(rankSuggestions(names, "", byName)).toStrictEqual([
    "abar",
    "bar",
    "barz",
    "qux",
    "zbar",
  ]);
});

test("matches any of an item's keys and respects the limit", () => {
  const users = [
    { login: "viewer1", display: "someone" },
    { login: "viewer2", display: "viewer12" },
  ];
  const ranked = rankSuggestions(users, "viewer1", {
    keys: (u) => [u.login, u.display],
    compare: (a, b) => a.login.localeCompare(b.login),
    limit: 1,
  });
  expect(ranked.map((u) => u.login)).toStrictEqual(["viewer1"]);
});
