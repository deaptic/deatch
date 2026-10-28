import { expect, test } from "vite-plus/test";
import type { FeedEntry } from "../types/index.ts";
import { getEntryId } from "./entryId.ts";
import { withNewer, withOlder } from "./historyView.ts";

const m = (n: number): FeedEntry =>
  ({
    kind: "message",
    message_id: `m${n}`,
    timestamp: n,
  }) as unknown as FeedEntry;
const ids = (entries: FeedEntry[]) => entries.map(getEntryId);
const view = (ns: number[], atOldest = false, atLive = false) => ({
  entries: ns.map(m),
  atOldest,
  atLive,
});

test("an older page goes first, and an empty one marks the oldest", () => {
  const next = withOlder(view([3, 4], false, true), [m(1), m(2), m(3)], 10);
  expect(ids(next.entries)).toStrictEqual(["m1", "m2", "m3", "m4"]);
  expect(next).toMatchObject({ atOldest: false, atLive: true });
  expect(withOlder(view([3]), [], 10).atOldest).toBe(true);
});

test("paging older past the limit lets go of the newest end", () => {
  const next = withOlder(view([3, 4], false, true), [m(1), m(2)], 3);
  expect(ids(next.entries)).toStrictEqual(["m1", "m2", "m3"]);
  expect(next.atLive).toBe(false);
});

test("a full newer page goes last and stays off live", () => {
  const next = withNewer(view([1, 2]), [m(3), m(4)], [m(9)], 2, 10);
  expect(ids(next.entries)).toStrictEqual(["m1", "m2", "m3", "m4"]);
  expect(next.atLive).toBe(false);
});

test("a short newer page joins the live entries", () => {
  const next = withNewer(view([1, 2]), [m(3)], [m(3), m(4), m(5)], 2, 10);
  expect(ids(next.entries)).toStrictEqual(["m1", "m2", "m3", "m4", "m5"]);
  expect(next.atLive).toBe(true);
});

test("paging newer past the limit lets go of the oldest end", () => {
  const next = withNewer(view([1, 2], true), [m(3), m(4)], [], 2, 3);
  expect(ids(next.entries)).toStrictEqual(["m2", "m3", "m4"]);
  expect(next.atOldest).toBe(false);
});
