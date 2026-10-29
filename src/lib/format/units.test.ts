import { expect, test } from "vite-plus/test";
import { formatPercent, formatPx, formatWholePercent } from "./units.ts";

test("pixels carry their unit", () => {
  expect(formatPx(14)).toBe("14px");
});

test("a whole percent has no decimals", () => {
  expect(formatWholePercent(5)).toBe("5%");
  expect(formatWholePercent(99.6)).toBe("100%");
});

test("a usage percent keeps one decimal below ten", () => {
  expect(formatPercent(0)).toBe("0.0%");
  expect(formatPercent(2.345)).toBe("2.3%");
  expect(formatPercent(42.6)).toBe("43%");
});
