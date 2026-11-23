import { expect, test } from "vite-plus/test";
import { emptyVisits, step, visit } from "./visits.ts";

const ch = (id: string) => ({ id });
const ids = (h: { entries: { id: string }[]; index: number }) => ({
  entries: h.entries.map((e) => e.id),
  index: h.index,
});

const abc = [ch("a"), ch("b"), ch("c")].reduce(visit, emptyVisits());

test("visit appends and ignores the current entry", () => {
  expect(ids(visit(abc, ch("c")))).toStrictEqual({
    entries: ["a", "b", "c"],
    index: 2,
  });
});

test("step moves within bounds and stops at the ends", () => {
  expect(ids(step(abc, -1)!)).toStrictEqual({
    entries: ["a", "b", "c"],
    index: 1,
  });
  expect(step(abc, 1)).toBeNull();
  expect(step(emptyVisits(), -1)).toBeNull();
});

test("visiting after stepping back drops the forward entries", () => {
  const back = step(step(abc, -1)!, -1)!;
  expect(ids(visit(back, ch("d")))).toStrictEqual({
    entries: ["a", "d"],
    index: 1,
  });
});

test("visiting the entry stepped to keeps the forward entries", () => {
  const back = step(abc, -1)!;
  expect(visit(back, ch("b"))).toStrictEqual(back);
});
