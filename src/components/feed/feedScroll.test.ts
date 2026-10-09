/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { centeredScrollTop, isAtBottom, maxScrollTop } from "./feedScroll.ts";

const viewport = { scrollTop: 0, scrollHeight: 2000, clientHeight: 500 };

Deno.test("isAtBottom allows a little slack", () => {
  assertEquals(isAtBottom({ ...viewport, scrollTop: 1500 }), true);
  assertEquals(isAtBottom({ ...viewport, scrollTop: 1430 }), true);
  assertEquals(isAtBottom({ ...viewport, scrollTop: 1400 }), false);
});

Deno.test("centeredScrollTop centres the item and clamps to the range", () => {
  assertEquals(maxScrollTop(viewport), 1500);
  assertEquals(centeredScrollTop(viewport, 1000, 40), 770);
  assertEquals(centeredScrollTop(viewport, 10, 40), 0);
  assertEquals(centeredScrollTop(viewport, 1980, 40), 1500);
});
