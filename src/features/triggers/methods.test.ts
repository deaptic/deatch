import { expect, test } from "vite-plus/test";
import { typedTarget } from "./methods.ts";

test("typedTarget takes the first word without the @", () => {
  expect(typedTarget("@someone hard")).toBe("someone");
  expect(typedTarget("the cat")).toBe("the");
});

test("typedTarget is null when nothing is typed", () => {
  expect(typedTarget("   ")).toBeNull();
  expect(typedTarget("@")).toBeNull();
});
