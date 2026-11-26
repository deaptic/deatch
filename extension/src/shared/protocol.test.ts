import { expect, test } from "vite-plus/test";
import { attributeOf } from "./protocol.ts";

test("page keys map to the attributes the page script watches", () => {
  expect(attributeOf("autoDrops")).toBe("data-deatch-auto-drops");
  expect(attributeOf("channel")).toBe("data-deatch-channel");
});
