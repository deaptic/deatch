/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { moved } from "./moved.ts";

Deno.test("moved places the item on the target row in both directions", () => {
  assertEquals(moved(["a", "b", "c"], 0, 1), ["b", "a", "c"]);
  assertEquals(moved(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
  assertEquals(moved(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
});
