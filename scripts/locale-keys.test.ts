import { expect, test } from "vite-plus/test";
import { removeKey, setKey } from "./locale-keys.ts";

const texts = { en: "Color", gb: "Colour", fi: "Väri" };

test("sets each locale's text and keeps keys in character order", () => {
  const before = { B_LABEL: "b", A_LABEL: "a" };
  expect(Object.keys(setKey(before, "en-US", "AB_LABEL", texts))).toEqual([
    "AB_LABEL",
    "A_LABEL",
    "B_LABEL",
  ]);
  expect(setKey({}, "en-US", "K", texts).K).toBe("Color");
  expect(setKey({}, "en-GB", "K", texts).K).toBe("Colour");
  expect(setKey({}, "en-GB", "K", { en: "Same", fi: "Sama" }).K).toBe("Same");
  expect(setKey({}, "fi", "K", texts).K).toBe("Väri");
});

test("removes a key and refuses a missing one", () => {
  expect(removeKey({ A: "a", B: "b" }, "A")).toEqual({ B: "b" });
  expect(() => removeKey({}, "A")).toThrow("no key A");
});
