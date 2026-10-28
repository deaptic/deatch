import { expect, test } from "vite-plus/test";
import { compile } from "./boolExpr.ts";

const flags = (...on: string[]) => new Map(on.map((name) => [name, true]));

test("evaluates a single flag, treating unknown flags as false", () => {
  expect(compile("mod")(flags("mod"))).toStrictEqual(true);
  expect(compile("mod")(flags())).toStrictEqual(false);
});

test("binds && tighter than ||", () => {
  const pred = compile("a || b && c");
  expect(pred(flags("a"))).toStrictEqual(true);
  expect(pred(flags("b"))).toStrictEqual(false);
  expect(pred(flags("b", "c"))).toStrictEqual(true);
});

test("honours parentheses and negation", () => {
  const pred = compile("!(a || b) && c");
  expect(pred(flags("c"))).toStrictEqual(true);
  expect(pred(flags("a", "c"))).toStrictEqual(false);
  expect(compile("!!a")(flags("a"))).toStrictEqual(true);
});

test("accepts namespaced identifiers", () => {
  expect(compile("badge:vip.1-x")(flags("badge:vip.1-x"))).toStrictEqual(true);
});

test("rejects malformed expressions", () => {
  for (const src of ["", "a &&", "(a", "a b", "a & b", "a )"]) {
    expect(() => compile(src), src).toThrow(Error);
  }
});
