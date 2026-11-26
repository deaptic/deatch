import { expect, test } from "vite-plus/test";
import { highlights, isNewToUser } from "./model.ts";

test("opens after an update, not on a first install", () => {
  expect(isNewToUser("1.0.0", "1.1.0", true)).toBe(true);
  expect(isNewToUser("1.1.0", "1.1.0", true)).toBe(false);
  expect(isNewToUser(null, "1.1.0", true)).toBe(true);
  expect(isNewToUser(null, "1.1.0", false)).toBe(false);
});

const CHANGELOG = [
  "## v1.1.0 — 1 January 2027",
  "",
  "Big one.",
  "",
  "### New",
  "- A.",
  "",
  "### Fixed",
  "- B.",
  "",
  "## v1.0.0 — 1 December 2026",
  "",
  "### Fixed",
  "- C.",
].join("\n");

test("highlights keep the summary, New and Improved, not fixes", () => {
  expect(highlights(CHANGELOG, "1.1.0")).toEqual({
    summary: "Big one.",
    groups: [{ title: "New", items: ["A."] }],
  });
  expect(highlights(CHANGELOG, "1.0.0")).toBeNull();
  expect(highlights(CHANGELOG, "2.0.0")).toBeNull();
});
