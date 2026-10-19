/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { zoomPlacement } from "./placement.ts";

const viewport = { width: 1000, height: 800 };
const square = { width: 300, height: 300 };
const anchorAt = (left: number, top: number) => ({
  left,
  right: left + 40,
  top,
  height: 40,
});

Deno.test("sits right of the anchor, centred on it", () => {
  assertEquals(zoomPlacement(anchorAt(100, 300), square, viewport), {
    x: 148,
    y: 170,
  });
});

Deno.test("centres a wide image by its own height", () => {
  const wide = { width: 300, height: 100 };
  assertEquals(zoomPlacement(anchorAt(100, 300), wide, viewport).y, 270);
});

Deno.test("flips left when the right side is too narrow", () => {
  assertEquals(zoomPlacement(anchorAt(800, 300), square, viewport).x, 492);
});

Deno.test("stays inside the viewport near its top and bottom edges", () => {
  assertEquals(zoomPlacement(anchorAt(100, 0), square, viewport).y, 8);
  assertEquals(zoomPlacement(anchorAt(100, 780), square, viewport).y, 492);
});
