import { expect, test } from "vite-plus/test";
import { formatApproxDuration, formatDuration } from "./duration.ts";

test("formatDuration uses the largest unit that divides evenly", () => {
  expect(formatDuration(0)).toStrictEqual("0s");
  expect(formatDuration(90)).toStrictEqual("90s");
  expect(formatDuration(120)).toStrictEqual("2m");
  expect(formatDuration(129600)).toStrictEqual("36h");
  expect(formatDuration(1209600)).toStrictEqual("2w");
});

test("formatApproxDuration rounds to the nearest whole unit", () => {
  expect(formatApproxDuration(0)).toStrictEqual("0s");
  expect(formatApproxDuration(30)).toStrictEqual("30s");
  expect(formatApproxDuration(599)).toStrictEqual("10m");
  expect(formatApproxDuration(7200)).toStrictEqual("2h");
  expect(formatApproxDuration(604800)).toStrictEqual("7d");
});
