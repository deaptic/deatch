import { expect, test } from "vite-plus/test";
import {
  nearestIndex,
  SPARK_HEIGHT,
  SPARK_WIDTH,
  sparkPoints,
} from "./sparkGeometry.ts";

test("points span the full width, with the highest value at the top", () => {
  const points = sparkPoints([10, 30, 20]);
  expect(points.map((p) => p.x)).toEqual([0, SPARK_WIDTH / 2, SPARK_WIDTH]);
  expect(points[1]!.y).toBeLessThan(points[2]!.y);
  expect(points[2]!.y).toBeLessThan(points[0]!.y);
  expect(Math.max(...points.map((p) => p.y))).toBeLessThan(SPARK_HEIGHT);
});

test("a flat line stays inside the box", () => {
  for (const point of sparkPoints([5, 5])) {
    expect(point.y).toBeGreaterThan(0);
    expect(point.y).toBeLessThan(SPARK_HEIGHT);
  }
});

test("the pointer snaps to the closest reading", () => {
  expect(nearestIndex(5, 0)).toBe(0);
  expect(nearestIndex(5, 0.6)).toBe(2);
  expect(nearestIndex(5, 1.4)).toBe(4);
});
