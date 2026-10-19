/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { wrapIndex } from "./createListNavigation.ts";

Deno.test("steps within the list", () => {
  assertEquals(wrapIndex(1, 1, 5), 2);
  assertEquals(wrapIndex(3, -1, 5), 2);
});

Deno.test("wraps past either end", () => {
  assertEquals(wrapIndex(4, 1, 5), 0);
  assertEquals(wrapIndex(0, -1, 5), 4);
  assertEquals(wrapIndex(0, -7, 5), 3);
});

Deno.test("an empty list stays at zero", () => {
  assertEquals(wrapIndex(0, 1, 0), 0);
});
