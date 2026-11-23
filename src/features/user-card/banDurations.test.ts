import { expect, test } from "vite-plus/test";
import { secondsFor } from "./banDurations.ts";

test("a preset times out for its seconds", () => {
  expect(secondsFor("10m")).toBe(600);
});

test("a ban has no duration", () => {
  expect(secondsFor("ban")).toBeNull();
});
