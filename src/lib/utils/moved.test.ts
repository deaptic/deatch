import { expect, test } from "vite-plus/test";
import { moved } from "./moved.ts";

test("moved places the item on the target row in both directions", () => {
  expect(moved(["a", "b", "c"], 0, 1)).toStrictEqual(["b", "a", "c"]);
  expect(moved(["a", "b", "c"], 0, 2)).toStrictEqual(["b", "c", "a"]);
  expect(moved(["a", "b", "c"], 2, 0)).toStrictEqual(["c", "a", "b"]);
});
