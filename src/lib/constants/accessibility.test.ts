import { expect, test } from "vite-plus/test";
import {
  canStep,
  clampToStops,
  FONT_SIZE_STEPS,
  nearestStep,
  stepStop,
  ZOOM_STEPS,
} from "./accessibility.ts";

test("clampToStops keeps values inside the first and last stop", () => {
  expect(clampToStops(10, [12, 16, 24])).toBe(12);
  expect(clampToStops(30, [12, 16, 24])).toBe(24);
  expect(clampToStops(13, [12, 16, 24])).toBe(13);
});

test("nearestStep snaps to the closest stop", () => {
  expect(nearestStep(13, [12, 16, 24])).toBe(12);
  expect(nearestStep(15, [12, 16, 24])).toBe(16);
});

test("stepStop moves to the neighbouring stop and stops at the ends", () => {
  expect(stepStop(100, ZOOM_STEPS, 1)).toBe(110);
  expect(stepStop(100, ZOOM_STEPS, -1)).toBe(90);
  expect(stepStop(95, ZOOM_STEPS, 1)).toBe(100);
  expect(stepStop(200, ZOOM_STEPS, 1)).toBe(200);
  expect(stepStop(50, ZOOM_STEPS, -1)).toBe(50);
});

test("canStep is false only at the end being stepped towards", () => {
  expect(canStep(12, FONT_SIZE_STEPS, -1)).toBe(false);
  expect(canStep(12, FONT_SIZE_STEPS, 1)).toBe(true);
  expect(canStep(24, FONT_SIZE_STEPS, 1)).toBe(false);
  expect(canStep(13, FONT_SIZE_STEPS, -1)).toBe(true);
});
