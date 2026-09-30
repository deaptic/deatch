/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { matchesAnyKeyword, matchesTerms, wordPattern } from "./wordMatch.ts";

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

Deno.test("a trailing * matches word endings", () => {
  for (const word of ["drop", "drops", "dropped"]) {
    assertEquals(matchesAnyKeyword(`big ${word} today`, ["drop*"]), true, word);
  }
  assertEquals(matchesAnyKeyword("airdrop", ["drop*"]), false);
});

Deno.test("a leading * matches word beginnings", () => {
  assertEquals(matchesAnyKeyword("airdrop", ["*drop"]), true);
  assertEquals(matchesAnyKeyword("drop", ["*drop"]), true);
  assertEquals(matchesAnyKeyword("drops", ["*drop"]), false);
});

Deno.test("* in the middle or on both sides stays inside one word", () => {
  assertEquals(matchesAnyKeyword("airdrops", ["*drop*"]), true);
  assertEquals(matchesAnyKeyword("colour", ["col*r"]), true);
  assertEquals(matchesAnyKeyword("col or", ["col*r"]), false);
  assertEquals(matchesAnyKeyword("d-rop", ["*drop*"]), false);
});

Deno.test("wildcards work with punctuation terms", () => {
  assertEquals(matchesAnyKeyword("!drops now", ["!drop*"]), true);
  assertEquals(matchesAnyKeyword("drops now", ["!drop*"]), false);
});

Deno.test("a keyword of only wildcards is ignored", () => {
  assertEquals(matchesAnyKeyword("any message", ["*"]), false);
  assertEquals(matchesAnyKeyword("any message", ["**", " * "]), false);
  assertEquals(matchesAnyKeyword("gg", ["*", "gg"]), true);
});

Deno.test("exact anchor matches the whole text, wildcards included", () => {
  assertEquals(matchesTerms("hiya", ["hi*"], "exact"), true);
  assertEquals(matchesTerms("hiya there", ["hi*"], "exact"), false);
  assertEquals(matchesTerms("HELLO", ["hello"], "exact", true), false);
  assertEquals(matchesTerms("HELLO", ["hello"], "exact"), true);
});
