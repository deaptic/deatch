import { expect, test } from "vite-plus/test";
import { goalProgress, goalsTitle, goalTitle } from "./goals.ts";

const goal = (description: string) => ({
  id: "g1",
  kind: "new_bit",
  description,
  current: 7,
  target: 100,
});

test("a goal is named by its description, or by its type without one", () => {
  expect(goalTitle(goal("New mic"))).toBe("New mic");
  expect(goalTitle(goal(""))).toBe("Bits goal");
});

test("a goal's progress reads current of target", () => {
  expect(goalProgress(goal(""))).toBe("7 of 100");
});

test("one goal is titled by itself, several by their count", () => {
  expect(goalsTitle([goal("New mic")])).toBe("New mic");
  expect(goalsTitle([goal(""), goal("")])).toBe("2 goals");
});
