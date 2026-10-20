/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { clampControl, DEFAULT_COMPRESSOR } from "./audio.ts";

Deno.test("keeps compressor controls inside their range and on their step", () => {
  assertEquals(clampControl("threshold", -80), -60);
  assertEquals(clampControl("ratio", 3.24), 3.2);
  assertEquals(clampControl("ratio", 0.5), 1);
  assertEquals(clampControl("gain", 0.3), 0.5);
  assertEquals(clampControl("ratio", 8), 4.5);
  assertEquals(clampControl("attack", 0.4), 1);
  assertEquals(clampControl("release", 21), 50);
  assertEquals(clampControl("release", 1234), 1000);
});

Deno.test("defaults start where the listener expects", () => {
  assertEquals(DEFAULT_COMPRESSOR, {
    threshold: -27,
    ratio: 3.2,
    attack: 3,
    release: 250,
    gain: 0,
  });
});
