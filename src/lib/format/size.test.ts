import { expect, test } from "vite-plus/test";
import { formatBytes } from "./size.ts";

test("formatBytes picks the largest whole unit", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(2048)).toBe("2 KB");
  expect(formatBytes(190_840_832)).toBe("182 MB");
  expect(formatBytes(1.5 * 1024 ** 3)).toBe("1.5 GB");
});
