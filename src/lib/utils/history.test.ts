/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { emptyHistory, step, visit } from "./history.ts";

const ch = (id: string) => ({ id });
const ids = (h: { entries: { id: string }[]; index: number }) => ({
  entries: h.entries.map((e) => e.id),
  index: h.index,
});

const abc = [ch("a"), ch("b"), ch("c")].reduce(visit, emptyHistory());

Deno.test("visit appends and ignores the current entry", () => {
  assertEquals(ids(visit(abc, ch("c"))), {
    entries: ["a", "b", "c"],
    index: 2,
  });
});

Deno.test("step moves within bounds and stops at the ends", () => {
  assertEquals(ids(step(abc, -1)!), { entries: ["a", "b", "c"], index: 1 });
  assertEquals(step(abc, 1), null);
  assertEquals(step(emptyHistory(), -1), null);
});

Deno.test("visiting after stepping back drops the forward entries", () => {
  const back = step(step(abc, -1)!, -1)!;
  assertEquals(ids(visit(back, ch("d"))), { entries: ["a", "d"], index: 1 });
});

Deno.test("visiting the entry stepped to keeps the forward entries", () => {
  const back = step(abc, -1)!;
  assertEquals(visit(back, ch("b")), back);
});
