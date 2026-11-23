import { expect, test } from "vite-plus/test";
import { gridStep } from "./gridStep.ts";

test("moves by one across a row and by a row's width vertically", () => {
  expect(gridStep(4, "ArrowRight", 3, 9)).toBe(5);
  expect(gridStep(4, "ArrowLeft", 3, 9)).toBe(3);
  expect(gridStep(4, "ArrowDown", 3, 9)).toBe(7);
  expect(gridStep(4, "ArrowUp", 3, 9)).toBe(1);
});

test("stays put at the edges and ignores other keys", () => {
  expect(gridStep(0, "ArrowLeft", 3, 9)).toBeNull();
  expect(gridStep(1, "ArrowUp", 3, 9)).toBeNull();
  expect(gridStep(7, "ArrowDown", 3, 9)).toBeNull();
  expect(gridStep(4, "Enter", 3, 9)).toBeNull();
});
