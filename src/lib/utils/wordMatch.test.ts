/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { matchesAnyKeyword, wordPattern } from "./wordMatch.ts";

Deno.test("matches keywords as whole words, case-insensitively", () => {
  assertEquals(matchesAnyKeyword("GG everyone", ["gg"]), true);
  assertEquals(matchesAnyKeyword("eggs", ["gg"]), false);
  assertEquals(matchesAnyKeyword("nothing here", ["gg", "pog"]), false);
});

Deno.test("matches keywords that start or end with punctuation", () => {
  assertEquals(matchesAnyKeyword("!drop", ["!drop"]), true);
  assertEquals(matchesAnyKeyword("type !drop now", ["!drop"]), true);
  assertEquals(matchesAnyKeyword("gg! nice", ["gg!"]), true);
  assertEquals(matchesAnyKeyword("!dropped", ["!drop"]), false);
});

Deno.test("treats regex characters literally and skips blank keywords", () => {
  assertEquals(matchesAnyKeyword("what (a) play", ["(a)"]), true);
  assertEquals(matchesAnyKeyword("axb", ["a.b"]), false);
  assertEquals(matchesAnyKeyword("anything", ["", "   "]), false);
});

Deno.test("start anchor requires the term at the beginning", () => {
  const start = new RegExp(wordPattern(["!socials"], "start"));
  assertEquals(start.test("!socials please"), true);
  assertEquals(start.test("please !socials"), false);
});
