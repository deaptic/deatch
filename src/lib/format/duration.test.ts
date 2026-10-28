import { expect, test } from "vite-plus/test";
import { formatApproxDuration, formatDuration } from "./duration.ts";

test("formatDuration uses the largest unit that divides evenly", () => {
  expect(formatDuration(0)).toBe("0s");
  expect(formatDuration(90)).toBe("90s");
  expect(formatDuration(120)).toBe("2m");
  expect(formatDuration(129600)).toBe("36h");
  expect(formatDuration(1209600)).toBe("2w");
});

test("formatApproxDuration rounds to the nearest whole unit", () => {
  expect(formatApproxDuration(0)).toBe("0s");
  expect(formatApproxDuration(30)).toBe("30s");
  expect(formatApproxDuration(599)).toBe("10m");
  expect(formatApproxDuration(7200)).toBe("2h");
  expect(formatApproxDuration(604800)).toBe("7d");
});
