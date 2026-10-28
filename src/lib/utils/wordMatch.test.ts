import { expect, test } from "vite-plus/test";
import { matchesTerms, wordPattern } from "./wordMatch.ts";

const matchesAnyKeyword = (text: string, keywords: string[]) =>
  matchesTerms(text, keywords, "anywhere");

test("matches keywords as whole words, case-insensitively", () => {
  expect(matchesAnyKeyword("GG everyone", ["gg"])).toBe(true);
  expect(matchesAnyKeyword("eggs", ["gg"])).toBe(false);
  expect(matchesAnyKeyword("nothing here", ["gg", "pog"])).toBe(false);
});

test("matches keywords that start or end with punctuation", () => {
  expect(matchesAnyKeyword("!drop", ["!drop"])).toBe(true);
  expect(matchesAnyKeyword("type !drop now", ["!drop"])).toBe(true);
  expect(matchesAnyKeyword("gg! nice", ["gg!"])).toBe(true);
  expect(matchesAnyKeyword("!dropped", ["!drop"])).toBe(false);
});

test("treats regex characters literally and skips blank keywords", () => {
  expect(matchesAnyKeyword("what (a) play", ["(a)"])).toBe(true);
  expect(matchesAnyKeyword("axb", ["a.b"])).toBe(false);
  expect(matchesAnyKeyword("anything", ["", "   "])).toBe(false);
});

test("start anchor requires the term at the beginning", () => {
  const start = new RegExp(wordPattern(["!socials"], "start"));
  expect(start.test("!socials please")).toBe(true);
  expect(start.test("please !socials")).toBe(false);
});

test("a trailing * matches word endings", () => {
  for (const word of ["drop", "drops", "dropped"]) {
    expect(matchesAnyKeyword(`big ${word} today`, ["drop*"]), word).toBe(true);
  }
  expect(matchesAnyKeyword("airdrop", ["drop*"])).toBe(false);
});

test("a leading * matches word beginnings", () => {
  expect(matchesAnyKeyword("airdrop", ["*drop"])).toBe(true);
  expect(matchesAnyKeyword("drop", ["*drop"])).toBe(true);
  expect(matchesAnyKeyword("drops", ["*drop"])).toBe(false);
});

test("* in the middle or on both sides stays inside one word", () => {
  expect(matchesAnyKeyword("airdrops", ["*drop*"])).toBe(true);
  expect(matchesAnyKeyword("colour", ["col*r"])).toBe(true);
  expect(matchesAnyKeyword("col or", ["col*r"])).toBe(false);
  expect(matchesAnyKeyword("d-rop", ["*drop*"])).toBe(false);
  expect(matchesAnyKeyword("x-drop-y", ["*drop*"])).toBe(true);
});

test("wildcards work with punctuation terms", () => {
  expect(matchesAnyKeyword("!drops now", ["!drop*"])).toBe(true);
  expect(matchesAnyKeyword("drops now", ["!drop*"])).toBe(false);
});

test("a keyword of only wildcards is ignored", () => {
  expect(matchesAnyKeyword("any message", ["*"])).toBe(false);
  expect(matchesAnyKeyword("any message", ["**", " * "])).toBe(false);
  expect(matchesAnyKeyword("gg", ["*", "gg"])).toBe(true);
});

test("exact anchor matches the whole text, wildcards included", () => {
  expect(matchesTerms("hiya", ["hi*"], "exact")).toBe(true);
  expect(matchesTerms("hiya there", ["hi*"], "exact")).toBe(false);
  expect(matchesTerms("HELLO", ["hello"], "exact", true)).toBe(false);
  expect(matchesTerms("HELLO", ["hello"], "exact")).toBe(true);
});

test("a symbol glued to the front means a different word", () => {
  expect(matchesAnyKeyword("@dead hi", ["dea*"])).toBe(false);
  expect(matchesAnyKeyword("#dead", ["dead"])).toBe(false);
  expect(matchesAnyKeyword(".dead", ["dead"])).toBe(false);
  expect(matchesAnyKeyword("hi @deaptic", ["deaptic"])).toBe(false);
});

test("only whitespace may surround a term, on both sides", () => {
  expect(matchesAnyKeyword("so (dead) rn", ["dead"])).toBe(false);
  expect(matchesAnyKeyword('he said "dead"', ["dead"])).toBe(false);
  expect(matchesAnyKeyword("!dead", ["dea*"])).toBe(false);
  expect(matchesAnyKeyword("im dead.", ["dead"])).toBe(false);
  expect(matchesAnyKeyword("dead, honestly", ["dead"])).toBe(false);
  expect(matchesAnyKeyword("good idea!", ["*dea"])).toBe(false);
  expect(matchesAnyKeyword("good idea", ["*dea"])).toBe(true);
  expect(matchesAnyKeyword("im dead lol", ["dea*"])).toBe(true);
});

test("* stands for anything but whitespace", () => {
  expect(matchesAnyKeyword("@idea", ["*dea"])).toBe(true);
  expect(matchesAnyKeyword("idea!", ["*dea"])).toBe(false);
  expect(matchesAnyKeyword("@ideas!", ["*dea*"])).toBe(true);
  expect(matchesAnyKeyword("dead!", ["dea*"])).toBe(true);
  expect(matchesAnyKeyword("de ad", ["de*"])).toBe(true);
  expect(matchesAnyKeyword("de ad", ["de*ad"])).toBe(false);
});
