import { expect, test } from "vite-plus/test";
import { branchBlocker, parseSync, syncBlocker } from "./branch.ts";

test("parses ahead and behind counts", () => {
  expect(parseSync("2\t3\n")).toEqual({ ahead: 2, behind: 3 });
});

test("rejects unexpected rev-list output", () => {
  expect(() => parseSync("fatal")).toThrow("unexpected rev-list output: fatal");
});

test("allows main", () => {
  expect(branchBlocker("main")).toBeNull();
});

test("refuses a detached HEAD or another branch", () => {
  expect(branchBlocker("HEAD")).toBe(
    "HEAD is detached — check out main to release",
  );
  expect(branchBlocker("feature")).toBe(
    "on feature — releases are cut from main",
  );
});

test("allows a branch in sync with its upstream", () => {
  expect(syncBlocker("main", { ahead: 0, behind: 0 })).toBeNull();
});

test("refuses a branch out of sync with its upstream", () => {
  expect(syncBlocker("main", { ahead: 0, behind: 2 })).toBe(
    "main is 2 commit(s) behind its upstream — pull first",
  );
  expect(syncBlocker("main", { ahead: 1, behind: 0 })).toBe(
    "main is 1 commit(s) ahead of its upstream — push first",
  );
});
