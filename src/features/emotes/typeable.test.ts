import { expect, test } from "vite-plus/test";
import { firstByName } from "./typeable.ts";

test("earlier lists win when names collide", () => {
  const map = firstByName([
    ["7TV", [{ name: "wave", url: "a" }]],
    [
      "Twitch",
      [
        { name: "wave", url: "b" },
        { name: "hi", url: "c" },
      ],
    ],
  ]);
  expect(map).toEqual({
    wave: { url: "a", source: "7TV" },
    hi: { url: "c", source: "Twitch" },
  });
});
