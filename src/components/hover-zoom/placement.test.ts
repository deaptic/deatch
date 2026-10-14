/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { zoomPlacement } from "./placement.ts";

const viewport = { width: 1000, height: 800 };
const anchorAt = (left: number, top: number) => ({
  left,
  right: left + 40,
  top,
  height: 40,
});

Deno.test("sits right of the anchor, centred on it", () => {
  assertEquals(zoomPlacement(anchorAt(100, 300), 300, viewport), {
    x: 148,
    y: 170,
  });
});

Deno.test("flips left when the right side is too narrow", () => {
  assertEquals(zoomPlacement(anchorAt(800, 300), 300, viewport).x, 492);
});

Deno.test("stays inside the viewport near its top and bottom edges", () => {
  assertEquals(zoomPlacement(anchorAt(100, 0), 300, viewport).y, 8);
  assertEquals(zoomPlacement(anchorAt(100, 780), 300, viewport).y, 492);
});
