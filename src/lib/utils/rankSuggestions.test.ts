/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { rankSuggestions } from "./rankSuggestions.ts";

const names = ["zbar", "barz", "abar", "bar", "qux"];
const byName = {
  keys: (name: string) => [name],
  compare: (a: string, b: string) => a.localeCompare(b),
};

Deno.test("ranks prefix matches before substring matches, each sorted", () => {
  assertEquals(rankSuggestions(names, "bar", byName), [
    "bar",
    "barz",
    "abar",
    "zbar",
  ]);
});

Deno.test("matches the query case-insensitively", () => {
  assertEquals(rankSuggestions(names, "BAR", byName)[0], "bar");
});

Deno.test("returns everything sorted for an empty query", () => {
  assertEquals(rankSuggestions(names, "", byName), [
    "abar",
    "bar",
    "barz",
    "qux",
    "zbar",
  ]);
});

Deno.test("matches any of an item's keys and respects the limit", () => {
  const users = [
    { login: "foo", display: "zzz" },
    { login: "qqq", display: "foobar" },
  ];
  const ranked = rankSuggestions(users, "foo", {
    keys: (u) => [u.login, u.display],
    compare: (a, b) => a.login.localeCompare(b.login),
    limit: 1,
  });
  assertEquals(ranked.map((u) => u.login), ["foo"]);
});
