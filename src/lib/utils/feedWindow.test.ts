import { expect, test } from "vite-plus/test";
import { offsetOf, windowAt, windowFromEnd } from "./feedWindow.ts";

const heights = [10, 20, 30, 40, 50];

test("windowAt takes the rows overlapping the band", () => {
  expect(windowAt(heights, 15, 65)).toStrictEqual({
    start: 1,
    end: 4,
    before: 10,
    after: 50,
  });
});

test("windowAt clamps a band past either end", () => {
  expect(windowAt(heights, -100, 5)).toStrictEqual({
    start: 0,
    end: 1,
    before: 0,
    after: 140,
  });
  expect(windowAt(heights, 500, 900)).toStrictEqual({
    start: 5,
    end: 5,
    before: 150,
    after: 0,
  });
});

test("windowFromEnd fills the span with the newest rows", () => {
  expect(windowFromEnd(heights, 80)).toStrictEqual({
    start: 3,
    end: 5,
    before: 60,
    after: 0,
  });
  expect(windowFromEnd(heights, 1000).start).toBe(0);
  expect(windowFromEnd([], 100)).toStrictEqual({
    start: 0,
    end: 0,
    before: 0,
    after: 0,
  });
});

test("offsetOf sums the rows above", () => {
  expect(offsetOf(heights, 0)).toBe(0);
  expect(offsetOf(heights, 3)).toBe(60);
});
