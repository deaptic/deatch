import { expect, test } from "vite-plus/test";
import { fromKeys } from "./fromKeys.ts";

test("holds an entry for every key", () => {
  expect(fromKeys(["a", "b"], (key) => key.toUpperCase())).toStrictEqual({
    a: "A",
    b: "B",
  });
});
