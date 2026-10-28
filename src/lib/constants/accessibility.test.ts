import { expect, test } from "vite-plus/test";
import {
  clampToStops,
  nearestStop,
  stepStop,
  ZOOM_STOPS,
} from "./accessibility.ts";

test("clampToStops keeps values inside the first and last stop", () => {
  expect(clampToStops(10, [12, 16, 24])).toBe(12);
  expect(clampToStops(30, [12, 16, 24])).toBe(24);
  expect(clampToStops(13, [12, 16, 24])).toBe(13);
});

test("nearestStop snaps to the closest stop", () => {
  expect(nearestStop(13, [12, 16, 24])).toBe(12);
  expect(nearestStop(15, [12, 16, 24])).toBe(16);
});

test("stepStop moves to the neighbouring stop and stops at the ends", () => {
  expect(stepStop(100, ZOOM_STOPS, 1)).toBe(110);
  expect(stepStop(100, ZOOM_STOPS, -1)).toBe(90);
  expect(stepStop(95, ZOOM_STOPS, 1)).toBe(100);
  expect(stepStop(200, ZOOM_STOPS, 1)).toBe(200);
  expect(stepStop(50, ZOOM_STOPS, -1)).toBe(50);
});
