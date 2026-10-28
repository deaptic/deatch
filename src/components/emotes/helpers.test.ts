import { expect, test } from "vite-plus/test";
import { COLUMNS, emojiUrl, nextVerticalIndex } from "./helpers.ts";

test("emojiUrl keeps FE0F only inside joiner sequences", () => {
  expect(emojiUrl("❤️")).toContain("/2764.png");
  expect(emojiUrl("❤️‍🔥")).toContain("/2764-fe0f-200d-1f525.png");
});

test("nextVerticalIndex moves within a section and across sections", () => {
  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      value: `${i}`,
      url: "",
      label: "",
    }));
  const sections = [
    { items: items(COLUMNS + 2), startIndex: 0 },
    { items: items(3), startIndex: COLUMNS + 2 },
  ];
  expect(nextVerticalIndex(sections, 1, 1)).toStrictEqual(COLUMNS + 1);
  expect(nextVerticalIndex(sections, COLUMNS + 1, 1)).toStrictEqual(
    COLUMNS + 3,
  );
  expect(nextVerticalIndex(sections, COLUMNS + 3, -1)).toStrictEqual(
    COLUMNS + 1,
  );
  expect(nextVerticalIndex(sections, 0, -1)).toBe(0);
});
