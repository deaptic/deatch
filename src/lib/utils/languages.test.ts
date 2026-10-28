import { expect, test } from "vite-plus/test";
import {
  allLanguages,
  languageName,
  orderLanguages,
  searchLanguages,
} from "./languages.ts";

test("names language codes in English", () => {
  expect(languageName("fi")).toStrictEqual("Finnish");
  expect(languageName("pt")).toStrictEqual("Portuguese");
  expect(languageName("other")).toStrictEqual("Other");
});

test("keeps pinned codes first, then the rest by name", () => {
  expect(orderLanguages(["en", "de", "fi", "ja", "fi"], ["fi"])).toStrictEqual([
    "fi",
    "en",
    "de",
    "ja",
  ]);
});

test("drops blanks and duplicates across pinned and seen", () => {
  expect(orderLanguages(["", "en", "sv"], ["sv", "", "sv"])).toStrictEqual([
    "sv",
    "en",
  ]);
});

test("knows every two-letter language the platform can name", () => {
  const all = allLanguages();
  expect(all.includes("fi")).toStrictEqual(true);
  expect(all.includes("en")).toStrictEqual(true);
  expect(all.includes("zz")).toStrictEqual(false);
  expect(all.includes("iw")).toStrictEqual(false);
});

test("finds languages by name or code, exact code first", () => {
  expect(searchLanguages("fi")[0]).toStrictEqual("fi");
  expect(searchLanguages("finn")).toStrictEqual(["fi"]);
  expect(searchLanguages("  GERM ")).toStrictEqual(["de"]);
  expect(searchLanguages("")).toStrictEqual([]);
});
