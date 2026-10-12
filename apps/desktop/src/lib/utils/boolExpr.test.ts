/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from "@std/assert";
import { compile } from "./boolExpr.ts";

const flags = (...on: string[]) => new Map(on.map((name) => [name, true]));

Deno.test("evaluates a single flag, treating unknown flags as false", () => {
  assertEquals(compile("mod")(flags("mod")), true);
  assertEquals(compile("mod")(flags()), false);
});

Deno.test("binds && tighter than ||", () => {
  const pred = compile("a || b && c");
  assertEquals(pred(flags("a")), true);
  assertEquals(pred(flags("b")), false);
  assertEquals(pred(flags("b", "c")), true);
});

Deno.test("honours parentheses and negation", () => {
  const pred = compile("!(a || b) && c");
  assertEquals(pred(flags("c")), true);
  assertEquals(pred(flags("a", "c")), false);
  assertEquals(compile("!!a")(flags("a")), true);
});

Deno.test("accepts namespaced identifiers", () => {
  assertEquals(compile("badge:vip.1-x")(flags("badge:vip.1-x")), true);
});

Deno.test("rejects malformed expressions", () => {
  for (const src of ["", "a &&", "(a", "a b", "a & b", "a )"]) {
    assertThrows(() => compile(src), Error, undefined, src);
  }
});
