import { expect, test } from "vite-plus/test";
import { notesFor, parseNotes, releases } from "./changelog.ts";

const CHANGELOG = [
  "# Changelog",
  "",
  "## v1.2.10 — 2 January 2027",
  "",
  "Ten.",
  "",
  "## v1.2.1 — 1 January 2027",
  "",
  "One.",
  "",
  "### Fixed",
  "- A thing.",
  "",
].join("\r\n");

test("returns the section for a version without its heading", () => {
  expect(notesFor(CHANGELOG, "1.2.1")).toBe("One.\n\n### Fixed\n- A thing.");
  expect(notesFor(CHANGELOG, "1.2.10")).toBe("Ten.");
  expect(notesFor("## v2.0.0 - 1 March 2027\n\nTwo.", "2.0.0")).toBe("Two.");
});

test("returns null for a missing or empty section", () => {
  expect(notesFor(CHANGELOG, "1.2")).toBeNull();
  expect(notesFor("## v1.0.0\n\n## v0.9.0\nOld.", "1.0.0")).toBeNull();
});

test("splits notes into the summary and grouped lines", () => {
  const notes = "Big one.\n\n### New\n\n- A.\n- B.\n\n### Fixed\n\n- C.";
  expect(parseNotes(notes)).toEqual({
    summary: "Big one.",
    groups: [
      { title: "New", items: ["A.", "B."] },
      { title: "Fixed", items: ["C."] },
    ],
  });
});

test("lists every release newest first with its date and notes", () => {
  expect(releases(CHANGELOG)).toEqual([
    {
      version: "1.2.10",
      date: "2 January 2027",
      notes: { summary: "Ten.", groups: [] },
    },
    {
      version: "1.2.1",
      date: "1 January 2027",
      notes: {
        summary: "One.",
        groups: [{ title: "Fixed", items: ["A thing."] }],
      },
    },
  ]);
});
