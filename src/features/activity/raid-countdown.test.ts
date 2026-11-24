import { expect, test } from "vite-plus/test";
import { RAID_DURATION_MS, secondsLeft } from "./model.ts";

test("counts down whole seconds and stops at zero", () => {
  expect(secondsLeft(0, 0)).toBe(RAID_DURATION_MS / 1000);
  expect(secondsLeft(0, 500)).toBe(RAID_DURATION_MS / 1000);
  expect(secondsLeft(0, RAID_DURATION_MS + 5000)).toBe(0);
});
