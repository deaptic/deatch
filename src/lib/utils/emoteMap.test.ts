import { expect, test } from "vite-plus/test";
import { emoteMap } from "./emoteMap.ts";

test("a later list wins a shared name", () => {
  const map = emoteMap([
    [{ name: "KEKW", url: "global" }],
    [{ name: "KEKW", url: "channel" }],
  ]);
  expect(map["KEKW"]).toBe("channel");
});

test("chat words never hit Object.prototype", () => {
  expect(emoteMap([])["constructor"]).toBeUndefined();
});
