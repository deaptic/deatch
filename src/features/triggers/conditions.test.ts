import { expect, test } from "vite-plus/test";
import { holds, needsValue, satisfied } from "./conditions.ts";

test("set and empty look only at the left side", () => {
  expect(holds("set", " someone ", "")).toBe(true);
  expect(holds("set", "  ", "")).toBe(false);
  expect(holds("empty", "", "x")).toBe(true);
  expect(needsValue("empty")).toBe(false);
  expect(needsValue("is")).toBe(true);
});

test("text comparisons ignore case and surrounding space", () => {
  expect(holds("is", "Hello", " hello ")).toBe(true);
  expect(holds("isNot", "Hello", "bye")).toBe(true);
  expect(holds("contains", "Big Dog", "dog")).toBe(true);
  expect(holds("notContains", "Big Dog", "cat")).toBe(true);
  expect(holds("notContains", "Big Dog", "DOG")).toBe(false);
});

test("above and below compare numbers and fail on anything else", () => {
  expect(holds("above", "10", "9.5")).toBe(true);
  expect(holds("below", "3", "3")).toBe(false);
  expect(holds("below", "2,5", "3")).toBe(true);
  expect(holds("above", "ten", "1")).toBe(false);
  expect(holds("above", "", "-1")).toBe(false);
});

test("a group needs every check, any one group is enough", () => {
  expect(satisfied([[true, true]])).toBe(true);
  expect(satisfied([[true, false]])).toBe(false);
  expect(satisfied([[true, false], [true]])).toBe(true);
  expect(satisfied([])).toBe(false);
});
