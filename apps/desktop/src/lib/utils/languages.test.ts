/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import {
  allLanguages,
  languageName,
  orderLanguages,
  searchLanguages,
} from "./languages.ts";

Deno.test("names language codes in English", () => {
  assertEquals(languageName("fi"), "Finnish");
  assertEquals(languageName("pt"), "Portuguese");
  assertEquals(languageName("other"), "Other");
});

Deno.test("keeps pinned codes first, then the rest by name", () => {
  assertEquals(
    orderLanguages(["en", "de", "fi", "ja", "fi"], ["fi"]),
    ["fi", "en", "de", "ja"],
  );
});

Deno.test("drops blanks and duplicates across pinned and seen", () => {
  assertEquals(orderLanguages(["", "en", "sv"], ["sv", "", "sv"]), [
    "sv",
    "en",
  ]);
});

Deno.test("knows every two-letter language the platform can name", () => {
  const all = allLanguages();
  assertEquals(all.includes("fi"), true);
  assertEquals(all.includes("en"), true);
  assertEquals(all.includes("zz"), false);
  assertEquals(all.includes("iw"), false);
});

Deno.test("finds languages by name or code, exact code first", () => {
  assertEquals(searchLanguages("fi")[0], "fi");
  assertEquals(searchLanguages("finn"), ["fi"]);
  assertEquals(searchLanguages("  GERM "), ["de"]);
  assertEquals(searchLanguages(""), []);
});
