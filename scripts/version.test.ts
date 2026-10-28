import { expect, test } from "vite-plus/test";
import { nextVersion } from "./version.ts";

test("bumps each part and resets the lower ones", () => {
  expect(nextVersion("1.2.3")).toBe("1.2.4");
  expect(nextVersion("1.2.3", "minor")).toBe("1.3.0");
  expect(nextVersion("1.2.3", "major")).toBe("2.0.0");
});

test("accepts an explicit version", () => {
  expect(nextVersion("1.2.3", "4.0.0")).toBe("4.0.0");
});

test("rejects an explicit version that is not x.y.z", () => {
  expect(() => nextVersion("1.2.3", "4.0")).toThrow("invalid version: 4.0");
});

test("rejects a current version that is not x.y.z", () => {
  expect(() => nextVersion("1.2", "patch")).toThrow(
    "unparseable current version: 1.2",
  );
});
