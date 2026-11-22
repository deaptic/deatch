import { expect, test } from "vite-plus/test";
import {
  addCondition,
  addGroup,
  BLANK_CONDITION,
  removeCondition,
  updateCondition,
} from "./conditionGroups.ts";

const a = { left: "a", op: "set", right: "" } as const;
const b = { left: "b", op: "set", right: "" } as const;

test("adding puts a blank condition in the group or in a new group", () => {
  expect(addCondition([[a]], 0)).toStrictEqual([[a, BLANK_CONDITION]]);
  expect(addGroup([[a]])).toStrictEqual([[a], [BLANK_CONDITION]]);
});

test("updating replaces only the one condition", () => {
  expect(updateCondition([[a, a], [a]], 0, 1, b)).toStrictEqual([[a, b], [a]]);
});

test("removing a group's last condition removes the group", () => {
  expect(removeCondition([[a, b], [b]], 0, 1)).toStrictEqual([[a], [b]]);
  expect(removeCondition([[a], [b]], 0, 0)).toStrictEqual([[b]]);
});
