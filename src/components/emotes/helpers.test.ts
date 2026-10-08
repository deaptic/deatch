/// <reference lib="deno.ns" />
import { assertEquals, assertStringIncludes } from "@std/assert";
import { COLUMNS, emojiUrl, nextVerticalIndex } from "./helpers.ts";

Deno.test("emojiUrl keeps FE0F only inside joiner sequences", () => {
  assertStringIncludes(emojiUrl("❤️"), "/2764.png");
  assertStringIncludes(
    emojiUrl("❤️‍🔥"),
    "/2764-fe0f-200d-1f525.png",
  );
});

Deno.test("nextVerticalIndex moves within a section and across sections", () => {
  const items = (n: number) =>
    Array.from(
      { length: n },
      (_, i) => ({ value: `${i}`, url: "", label: "" }),
    );
  const sections = [
    { items: items(COLUMNS + 2), startIndex: 0 },
    { items: items(3), startIndex: COLUMNS + 2 },
  ];
  assertEquals(nextVerticalIndex(sections, 1, 1), COLUMNS + 1);
  assertEquals(nextVerticalIndex(sections, COLUMNS + 1, 1), COLUMNS + 3);
  assertEquals(nextVerticalIndex(sections, COLUMNS + 3, -1), COLUMNS + 1);
  assertEquals(nextVerticalIndex(sections, 0, -1), 0);
});
