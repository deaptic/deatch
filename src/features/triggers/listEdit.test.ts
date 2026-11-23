import { expect, test } from "vite-plus/test";
import { removedAt, replacedAt } from "./listEdit.ts";

test("replacedAt swaps one item and leaves the rest", () => {
  expect(replacedAt(["a", "b", "c"], 1, "x")).toStrictEqual(["a", "x", "c"]);
  expect(replacedAt(["a"], 5, "x")).toStrictEqual(["a"]);
});

test("removedAt drops one item and leaves the rest", () => {
  expect(removedAt(["a", "b", "c"], 1)).toStrictEqual(["a", "c"]);
  expect(removedAt(["a"], 5)).toStrictEqual(["a"]);
});
