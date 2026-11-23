import { expect, test } from "vite-plus/test";
import { escapeRegExp } from "./regExp.ts";

test("special characters match literally", () => {
  const text = "a.b*c+(d)[e]{f}^$|?\\";
  expect(new RegExp(`^${escapeRegExp(text)}$`).test(text)).toBe(true);
});

test("a dot no longer matches any character", () => {
  expect(new RegExp(escapeRegExp("a.b")).test("axb")).toBe(false);
});
