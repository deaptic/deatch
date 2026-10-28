import { expect, test } from "vite-plus/test";
import { matchesTerms, wordPattern } from "./wordMatch.ts";

const matchesAnyKeyword = (text: string, keywords: string[]) =>
  matchesTerms(text, keywords, "anywhere");

test("matches keywords as whole words, case-insensitively", () => {
  expect(matchesAnyKeyword("GG everyone", ["gg"])).toStrictEqual(true);
  expect(matchesAnyKeyword("eggs", ["gg"])).toStrictEqual(false);
  expect(matchesAnyKeyword("nothing here", ["gg", "pog"])).toStrictEqual(false);
});

test("matches keywords that start or end with punctuation", () => {
  expect(matchesAnyKeyword("!drop", ["!drop"])).toStrictEqual(true);
  expect(matchesAnyKeyword("type !drop now", ["!drop"])).toStrictEqual(true);
  expect(matchesAnyKeyword("gg! nice", ["gg!"])).toStrictEqual(true);
  expect(matchesAnyKeyword("!dropped", ["!drop"])).toStrictEqual(false);
});

test("treats regex characters literally and skips blank keywords", () => {
  expect(matchesAnyKeyword("what (a) play", ["(a)"])).toStrictEqual(true);
  expect(matchesAnyKeyword("axb", ["a.b"])).toStrictEqual(false);
  expect(matchesAnyKeyword("anything", ["", "   "])).toStrictEqual(false);
});

test("start anchor requires the term at the beginning", () => {
  const start = new RegExp(wordPattern(["!socials"], "start"));
  expect(start.test("!socials please")).toStrictEqual(true);
  expect(start.test("please !socials")).toStrictEqual(false);
});

test("a trailing * matches word endings", () => {
  for (const word of ["drop", "drops", "dropped"]) {
    expect(
      matchesAnyKeyword(`big ${word} today`, ["drop*"]),
      word,
    ).toStrictEqual(true);
  }
  expect(matchesAnyKeyword("airdrop", ["drop*"])).toStrictEqual(false);
});

test("a leading * matches word beginnings", () => {
  expect(matchesAnyKeyword("airdrop", ["*drop"])).toStrictEqual(true);
  expect(matchesAnyKeyword("drop", ["*drop"])).toStrictEqual(true);
  expect(matchesAnyKeyword("drops", ["*drop"])).toStrictEqual(false);
});

test("* in the middle or on both sides stays inside one word", () => {
  expect(matchesAnyKeyword("airdrops", ["*drop*"])).toStrictEqual(true);
  expect(matchesAnyKeyword("colour", ["col*r"])).toStrictEqual(true);
  expect(matchesAnyKeyword("col or", ["col*r"])).toStrictEqual(false);
  expect(matchesAnyKeyword("d-rop", ["*drop*"])).toStrictEqual(false);
  expect(matchesAnyKeyword("x-drop-y", ["*drop*"])).toStrictEqual(true);
});

test("wildcards work with punctuation terms", () => {
  expect(matchesAnyKeyword("!drops now", ["!drop*"])).toStrictEqual(true);
  expect(matchesAnyKeyword("drops now", ["!drop*"])).toStrictEqual(false);
});

test("a keyword of only wildcards is ignored", () => {
  expect(matchesAnyKeyword("any message", ["*"])).toStrictEqual(false);
  expect(matchesAnyKeyword("any message", ["**", " * "])).toStrictEqual(false);
  expect(matchesAnyKeyword("gg", ["*", "gg"])).toStrictEqual(true);
});

test("exact anchor matches the whole text, wildcards included", () => {
  expect(matchesTerms("hiya", ["hi*"], "exact")).toStrictEqual(true);
  expect(matchesTerms("hiya there", ["hi*"], "exact")).toStrictEqual(false);
  expect(matchesTerms("HELLO", ["hello"], "exact", true)).toStrictEqual(false);
  expect(matchesTerms("HELLO", ["hello"], "exact")).toStrictEqual(true);
});

test("a symbol glued to the front means a different word", () => {
  expect(matchesAnyKeyword("@dead hi", ["dea*"])).toStrictEqual(false);
  expect(matchesAnyKeyword("#dead", ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword(".dead", ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword("hi @deaptic", ["deaptic"])).toStrictEqual(false);
});

test("only whitespace may surround a term, on both sides", () => {
  expect(matchesAnyKeyword("so (dead) rn", ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword('he said "dead"', ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword("!dead", ["dea*"])).toStrictEqual(false);
  expect(matchesAnyKeyword("im dead.", ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword("dead, honestly", ["dead"])).toStrictEqual(false);
  expect(matchesAnyKeyword("good idea!", ["*dea"])).toStrictEqual(false);
  expect(matchesAnyKeyword("good idea", ["*dea"])).toStrictEqual(true);
  expect(matchesAnyKeyword("im dead lol", ["dea*"])).toStrictEqual(true);
});

test("* stands for anything but whitespace", () => {
  expect(matchesAnyKeyword("@idea", ["*dea"])).toStrictEqual(true);
  expect(matchesAnyKeyword("idea!", ["*dea"])).toStrictEqual(false);
  expect(matchesAnyKeyword("@ideas!", ["*dea*"])).toStrictEqual(true);
  expect(matchesAnyKeyword("dead!", ["dea*"])).toStrictEqual(true);
  expect(matchesAnyKeyword("de ad", ["de*"])).toStrictEqual(true);
  expect(matchesAnyKeyword("de ad", ["de*ad"])).toStrictEqual(false);
});
