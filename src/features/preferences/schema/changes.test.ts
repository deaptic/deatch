import { expect, test } from "vite-plus/test";
import { changesFrom } from "./changes.ts";

test("only values that differ from the defaults are kept, nested ones too", () => {
  const base = { on: true, size: 16, list: ["a"], nested: { x: 1, y: 2 } };
  expect(changesFrom(base, base)).toBeUndefined();
  expect(
    changesFrom(
      { on: false, size: 16, list: ["a", "b"], nested: { x: 1, y: 3 } },
      base,
    ),
  ).toStrictEqual({ on: false, list: ["a", "b"], nested: { y: 3 } });
});
