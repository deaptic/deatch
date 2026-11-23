import { expect, test } from "vite-plus/test";
import { shouldCheck } from "./model.ts";

const HOUR = 60 * 60 * 1000;
const update = { version: "1.0.0", install: () => Promise.resolve() };

test("checks at most once an hour", () => {
  expect(shouldCheck({ kind: "none" }, 0, HOUR)).toBe(true);
  expect(shouldCheck({ kind: "none" }, HOUR, HOUR + 1)).toBe(false);
});

test("stops checking once an update is found", () => {
  expect(shouldCheck({ kind: "ready", update }, 0, HOUR)).toBe(false);
  expect(shouldCheck({ kind: "installing", update }, 0, HOUR)).toBe(false);
});
