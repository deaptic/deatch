import { expect, test } from "vite-plus/test";
import { DONUT_CIRCUMFERENCE, donutSegments } from "./donutGeometry.ts";

test("slices follow each other around the ring with a gap between them", () => {
  const [a, b] = donutSegments([3, 1]);
  expect(a).toEqual({ offset: 1, length: 73 });
  expect(b).toEqual({ offset: 76, length: 23 });
});

test("a single slice fills the whole ring without a gap", () => {
  expect(donutSegments([5, 0])[0]).toEqual({
    offset: 0,
    length: DONUT_CIRCUMFERENCE,
  });
});

test("nothing to draw when everything is zero", () => {
  expect(donutSegments([0, 0])).toEqual([]);
});
