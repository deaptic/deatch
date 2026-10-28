import { expect, test } from "vite-plus/test";
import { centeredScrollTop, isAtBottom, maxScrollTop } from "./feedScroll.ts";

const viewport = { scrollTop: 0, scrollHeight: 2000, clientHeight: 500 };

test("isAtBottom only forgives sub-pixel offsets", () => {
  expect(isAtBottom({ ...viewport, scrollTop: 1500 })).toBe(true);
  expect(isAtBottom({ ...viewport, scrollTop: 1499.5 })).toBe(true);
  expect(isAtBottom({ ...viewport, scrollTop: 1490 })).toBe(false);
});

test("centeredScrollTop centres the item and clamps to the range", () => {
  expect(maxScrollTop(viewport)).toBe(1500);
  expect(centeredScrollTop(viewport, 1000, 40)).toBe(770);
  expect(centeredScrollTop(viewport, 10, 40)).toBe(0);
  expect(centeredScrollTop(viewport, 1980, 40)).toBe(1500);
});
