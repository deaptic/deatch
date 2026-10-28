import { expect, test } from "vite-plus/test";
import { formatPx, formatWholePercent } from "./units.ts";

test("pixels carry their unit", () => {
  expect(formatPx(14)).toBe("14px");
});

test("a whole percent has no decimals", () => {
  expect(formatWholePercent(5)).toBe("5%");
  expect(formatWholePercent(99.6)).toBe("100%");
});
