import { expect, test } from "vite-plus/test";
import { at } from "./at.ts";

test("returns the item at a valid index", () => {
  expect(at(["a", "b"], 1)).toBe("b");
});

test("throws for an index out of range", () => {
  expect(() => at(["a"], 1)).toThrow("index 1 out of range (1)");
  expect(() => at(["a"], -1)).toThrow(RangeError);
});
