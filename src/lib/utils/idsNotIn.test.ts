import { expect, test } from "vite-plus/test";
import { idsNotIn } from "./idsNotIn.ts";

test("keeps wanted ids that are not known, in order", () => {
  expect(idsNotIn(new Set(["a"]), ["b", "a", "c"])).toStrictEqual(["b", "c"]);
});

test("drops duplicates and absent ids", () => {
  expect(
    idsNotIn(new Set(), ["b", undefined, "b", "c", undefined]),
  ).toStrictEqual(["b", "c"]);
});
