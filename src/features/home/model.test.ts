import { expect, test } from "vite-plus/test";
import {
  ranked,
  slices,
  tileRows,
  total,
  homeChannels,
  comingUp,
  latestLive,
  weekStart,
} from "./model.ts";

test("coming up keeps the next 7 days, soonest first", () => {
  const now = Date.parse("2026-11-27T12:00:00Z");
  const at = (start: string) => ({ start });
  expect(
    comingUp(
      [
        at("2026-11-30T20:00:00Z"),
        at("2026-11-27T11:00:00Z"),
        at("2026-12-05T13:00:00Z"),
        at("2026-11-27T15:00:00Z"),
      ],
      now,
    ),
  ).toEqual([at("2026-11-27T15:00:00Z"), at("2026-11-30T20:00:00Z")]);
});

test("the week covers today and the 6 days before it", () => {
  const now = new Date(2026, 10, 27, 15, 30).getTime();
  expect(weekStart(now)).toBe(new Date(2026, 10, 21).getTime());
});

test("counts rank from most to least, dropping zeros", () => {
  const rows = ranked({ b: 3, a: 3, c: 9, d: 0 });
  expect(rows).toEqual([
    { key: "c", count: 9 },
    { key: "a", count: 3 },
    { key: "b", count: 3 },
  ]);
  expect(total(rows)).toBe(15);
});

test("the top four channels get a slice and the rest share one", () => {
  const entries = ["a", "b", "c", "d", "e"].map((name, i) => ({
    name,
    count: 10 - i,
  }));
  const result = slices(entries, 50);
  expect(result.map((s) => s.name)).toEqual(["a", "b", "c", "d", null]);
  expect(result.at(-1)).toEqual({ name: null, count: 16 });
});

test("no extra slice when the top channels cover everything", () => {
  expect(slices([{ name: "a", count: 3 }], 3)).toEqual([
    { name: "a", count: 3 },
  ]);
});

test("the three latest streams to start, newest first", () => {
  const at = (startedAt: string) => ({ startedAt });
  expect(
    latestLive([
      at("2026-11-27T09:00:00Z"),
      at("2026-11-27T11:50:00Z"),
      at("2026-11-27T10:30:00Z"),
      at("2026-11-27T11:15:00Z"),
    ]),
  ).toEqual([
    at("2026-11-27T11:50:00Z"),
    at("2026-11-27T11:15:00Z"),
    at("2026-11-27T10:30:00Z"),
  ]);
});

test("home channels keep the group order, drop repeats and stop at 40", () => {
  expect(homeChannels(["a", "b"], ["b", "c"], ["a", "d"])).toEqual([
    "a",
    "b",
    "c",
    "d",
  ]);
  const many = Array.from({ length: 60 }, (_, i) => String(i));
  expect(homeChannels(many)).toHaveLength(40);
});

test("small emote tiles split into at most two full rows", () => {
  expect([0, 1, 2, 3, 4, 5, 6].map(tileRows)).toEqual([
    [],
    [1],
    [2],
    [3],
    [2, 2],
    [3, 2],
    [3, 3],
  ]);
});
