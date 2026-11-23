import { expect, test } from "vite-plus/test";
import {
  allLanguages,
  languageName,
  orderLanguages,
  searchLanguages,
} from "./languages.ts";

test("names language codes in English", () => {
  expect(languageName("fi")).toBe("Finnish");
  expect(languageName("pt")).toBe("Portuguese");
  expect(languageName("other")).toBe("Other");
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
  expect(all.includes("fi")).toBe(true);
  expect(all.includes("en")).toBe(true);
  expect(all.includes("zz")).toBe(false);
  expect(all.includes("iw")).toBe(false);
});

test("finds languages by name or code, exact code first", () => {
  expect(searchLanguages("fi")[0]).toBe("fi");
  expect(searchLanguages("finn")).toStrictEqual(["fi"]);
  expect(searchLanguages("  GERM ")).toStrictEqual(["de"]);
  expect(searchLanguages("")).toStrictEqual([]);
});
