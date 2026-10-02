/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import {
  clampToStops,
  nearestStop,
  stepStop,
  ZOOM_STOPS,
} from "./accessibility.ts";

Deno.test("clampToStops keeps values inside the first and last stop", () => {
  assertEquals(clampToStops(10, [12, 16, 24]), 12);
  assertEquals(clampToStops(30, [12, 16, 24]), 24);
  assertEquals(clampToStops(13, [12, 16, 24]), 13);
});

Deno.test("nearestStop snaps to the closest stop", () => {
  assertEquals(nearestStop(13, [12, 16, 24]), 12);
  assertEquals(nearestStop(15, [12, 16, 24]), 16);
});

Deno.test("stepStop moves to the neighbouring stop and stops at the ends", () => {
  assertEquals(stepStop(100, ZOOM_STOPS, 1), 110);
  assertEquals(stepStop(100, ZOOM_STOPS, -1), 90);
  assertEquals(stepStop(95, ZOOM_STOPS, 1), 100);
  assertEquals(stepStop(200, ZOOM_STOPS, 1), 200);
  assertEquals(stepStop(50, ZOOM_STOPS, -1), 50);
});
