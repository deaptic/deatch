import { expect, test } from "vite-plus/test";
import { centeredScrollTop, isAtBottom, maxScrollTop } from "./feedScroll.ts";

const viewport = { scrollTop: 0, scrollHeight: 2000, clientHeight: 500 };

test("isAtBottom only forgives sub-pixel offsets", () => {
  expect(isAtBottom({ ...viewport, scrollTop: 1500 })).toStrictEqual(true);
  expect(isAtBottom({ ...viewport, scrollTop: 1499.5 })).toStrictEqual(true);
  expect(isAtBottom({ ...viewport, scrollTop: 1490 })).toStrictEqual(false);
});

test("centeredScrollTop centres the item and clamps to the range", () => {
  expect(maxScrollTop(viewport)).toStrictEqual(1500);
  expect(centeredScrollTop(viewport, 1000, 40)).toStrictEqual(770);
  expect(centeredScrollTop(viewport, 10, 40)).toStrictEqual(0);
  expect(centeredScrollTop(viewport, 1980, 40)).toStrictEqual(1500);
});
