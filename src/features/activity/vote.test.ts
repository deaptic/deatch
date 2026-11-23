import { expect, test } from "vite-plus/test";
import { canStartVote, filledOptions } from "./vote.ts";

test("filledOptions trims and drops empty options", () => {
  expect(filledOptions([" Yes ", "", "  ", "No"])).toEqual(["Yes", "No"]);
});

test("a vote needs a question and two filled options", () => {
  expect(canStartVote("Win?", ["Yes", "No"])).toBe(true);
  expect(canStartVote("  ", ["Yes", "No"])).toBe(false);
  expect(canStartVote("Win?", ["Yes", " "])).toBe(false);
  expect(canStartVote("Win?", ["Yes", "", "No"])).toBe(true);
});
