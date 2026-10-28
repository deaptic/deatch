import { expect, test } from "vite-plus/test";
import { wrapIndex } from "./createListNavigation.ts";

test("steps within the list", () => {
  expect(wrapIndex(1, 1, 5)).toStrictEqual(2);
  expect(wrapIndex(3, -1, 5)).toStrictEqual(2);
});

test("wraps past either end", () => {
  expect(wrapIndex(4, 1, 5)).toStrictEqual(0);
  expect(wrapIndex(0, -1, 5)).toStrictEqual(4);
  expect(wrapIndex(0, -7, 5)).toStrictEqual(3);
});

test("an empty list stays at zero", () => {
  expect(wrapIndex(0, 1, 0)).toStrictEqual(0);
});
