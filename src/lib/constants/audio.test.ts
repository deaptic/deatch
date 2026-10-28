import { expect, test } from "vite-plus/test";
import { clampControl, DEFAULT_COMPRESSOR } from "./audio.ts";

test("keeps compressor controls inside their range and on their step", () => {
  expect(clampControl("threshold", -80)).toBe(-60);
  expect(clampControl("ratio", 3.24)).toBe(3.2);
  expect(clampControl("ratio", 0.5)).toBe(1);
  expect(clampControl("gain", 0.3)).toBe(0.5);
  expect(clampControl("ratio", 8)).toBe(4.5);
  expect(clampControl("attack", 0.4)).toBe(1);
  expect(clampControl("release", 21)).toBe(50);
  expect(clampControl("release", 1234)).toBe(1000);
});

test("defaults start where the listener expects", () => {
  expect(DEFAULT_COMPRESSOR).toStrictEqual({
    threshold: -27,
    ratio: 3.2,
    attack: 3,
    release: 250,
    gain: 0,
  });
});
