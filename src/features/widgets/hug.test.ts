import { expect, test } from "vite-plus/test";
import { hugWidth } from "./hug.ts";

test("a wrapped tile shrinks to its longest line plus its right padding", () => {
  const lines = [
    { left: 20, right: 300 },
    { left: 20, right: 180 },
  ];
  expect(hugWidth(lines, 10, 1, 14)).toBe(304);
});

test("measurements at 200% scale come back in unzoomed pixels", () => {
  expect(hugWidth([{ left: 40, right: 600 }], 20, 2, 14)).toBe(304);
});

test("nothing to measure leaves the tile alone", () => {
  expect(hugWidth([], 0, 1, 14)).toBeNull();
});
