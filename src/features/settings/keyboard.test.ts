import { expect, test } from "vite-plus/test";
import defaultKeymap from "../../default-keymap.json" with { type: "json" };
import { ACTION_LABELS, CHANNEL_SELECT } from "./keyboard.ts";

test("every action in the keymap has a label", () => {
  const unlabelled = Object.values(defaultKeymap)
    .flat()
    .filter((action) => !CHANNEL_SELECT.test(action) && !ACTION_LABELS[action]);
  expect(unlabelled).toStrictEqual([]);
});
