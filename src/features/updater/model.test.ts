import { expect, test } from "vite-plus/test";
import { pendingUpdate, shouldCheck } from "./model.ts";

const HOUR = 60 * 60 * 1000;
const update = { version: "1.0.0", install: () => Promise.resolve() };

test("checks at most once an hour", () => {
  expect(shouldCheck({ kind: "unchecked" }, 0, HOUR)).toBe(true);
  expect(shouldCheck({ kind: "current" }, HOUR, HOUR + 1)).toBe(false);
});

test("checks again after being up to date or unreachable", () => {
  expect(shouldCheck({ kind: "current" }, 0, HOUR)).toBe(true);
  expect(shouldCheck({ kind: "unreachable" }, 0, HOUR)).toBe(true);
});

test("never checks while a check runs or once an update is found", () => {
  expect(shouldCheck({ kind: "checking" }, 0, HOUR)).toBe(false);
  expect(shouldCheck({ kind: "ready", update }, 0, HOUR)).toBe(false);
  expect(shouldCheck({ kind: "installing", update }, 0, HOUR)).toBe(false);
});

test("only found updates are pending", () => {
  expect(pendingUpdate({ kind: "current" })).toBeNull();
  expect(pendingUpdate({ kind: "ready", update })).toBe(update);
});
