import { expect, test } from "vite-plus/test";
import { checkTag, MAX_TAGS } from "./streamTags.ts";

test("accepts letters and numbers in any language, without a leading #", () => {
  expect(checkTag(" #Suomi ", [])).toEqual({ ok: true, tag: "Suomi" });
  expect(checkTag("Speedrun2", [])).toEqual({ ok: true, tag: "Speedrun2" });
});

test("rejects spaces, symbols, long tags, duplicates and a full list", () => {
  expect(checkTag("two words", [])).toEqual({ ok: false, reason: "format" });
  expect(checkTag("no-dashes", [])).toEqual({ ok: false, reason: "format" });
  expect(checkTag("a".repeat(26), [])).toEqual({ ok: false, reason: "length" });
  expect(checkTag("chill", ["Chill"])).toEqual({
    ok: false,
    reason: "duplicate",
  });
  const full = Array.from({ length: MAX_TAGS }, (_, i) => `tag${i}`);
  expect(checkTag("more", full)).toEqual({ ok: false, reason: "full" });
});
