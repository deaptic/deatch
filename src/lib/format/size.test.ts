import { expect, test } from "vite-plus/test";
import { formatBytes, formatPercent } from "./size.ts";

test("formatBytes picks the largest whole unit", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(2048)).toBe("2 KB");
  expect(formatBytes(190_840_832)).toBe("182 MB");
  expect(formatBytes(1.5 * 1024 ** 3)).toBe("1.5 GB");
});

test("formatPercent keeps one decimal below ten", () => {
  expect(formatPercent(0)).toBe("0.0%");
  expect(formatPercent(2.345)).toBe("2.3%");
  expect(formatPercent(42.6)).toBe("43%");
});
