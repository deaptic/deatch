import { expect, test } from "vite-plus/test";
import { zoomPlacement } from "./placement.ts";

const viewport = { width: 1000, height: 800 };
const square = { width: 300, height: 300 };
const anchorAt = (left: number, top: number) => ({
  left,
  right: left + 40,
  top,
  height: 40,
});

test("sits right of the anchor, centred on it", () => {
  expect(zoomPlacement(anchorAt(100, 300), square, viewport)).toStrictEqual({
    x: 148,
    y: 170,
  });
});

test("centres a wide image by its own height", () => {
  const wide = { width: 300, height: 100 };
  expect(zoomPlacement(anchorAt(100, 300), wide, viewport).y).toStrictEqual(
    270,
  );
});

test("flips left when the right side is too narrow", () => {
  expect(zoomPlacement(anchorAt(800, 300), square, viewport).x).toStrictEqual(
    492,
  );
});

test("stays inside the viewport near its top and bottom edges", () => {
  expect(zoomPlacement(anchorAt(100, 0), square, viewport).y).toStrictEqual(8);
  expect(zoomPlacement(anchorAt(100, 780), square, viewport).y).toStrictEqual(
    492,
  );
});
