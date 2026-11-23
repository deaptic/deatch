import { expect, test } from "vite-plus/test";
import { listSize } from "./listSize.ts";

test("counts a plain list", () => {
  expect(listSize([1, 2, 3])).toStrictEqual({ count: 3, more: false });
});

test("counts a page and sees whether another follows", () => {
  expect(listSize({ data: [1], pagination: { cursor: "next" } })).toStrictEqual(
    { count: 1, more: true },
  );
  expect(listSize({ data: [], pagination: { cursor: null } })).toStrictEqual({
    count: 0,
    more: false,
  });
  expect(listSize({ data: [1, 2] })).toStrictEqual({ count: 2, more: false });
});

test("anything else has no size", () => {
  expect(listSize(null)).toBeNull();
  expect(listSize("ok")).toBeNull();
  expect(listSize({ data: "x" })).toBeNull();
});
