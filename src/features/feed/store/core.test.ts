// @vitest-environment happy-dom
import { expect, test } from "vite-plus/test";
import { unwrap } from "solid-js/store";
import type { FeedEntry, FeedMessage } from "../types.ts";
import {
  ensureFeed,
  feeds,
  flushQueued,
  requeueUnlogged,
  takeUnlogged,
} from "./core.ts";
import { appendItem, queueItem } from "./write.ts";
import { markMessageDeleted } from "./mutate.ts";

const message = (id: string): FeedEntry =>
  ({ kind: "message", message_id: id, timestamp: 1 }) as unknown as FeedEntry;

test("every added or changed entry waits for the log once, in its latest state", () => {
  ensureFeed("c1");
  takeUnlogged();
  appendItem("c1", message("a"));
  appendItem("c1", message("b"));
  markMessageDeleted("c1", "a");

  const taken = takeUnlogged().get("c1") ?? [];
  expect(taken.map((e) => (e as FeedMessage).message_id)).toStrictEqual([
    "a",
    "b",
  ]);
  expect((unwrap(taken[0]) as FeedMessage).deleted).toBe(true);
  expect(takeUnlogged().size).toBe(0);
});

test("entries from a failed write go back ahead of newer ones, newer state winning", () => {
  ensureFeed("c1");
  takeUnlogged();
  appendItem("c1", message("b"));
  appendItem("c1", message("c"));
  requeueUnlogged("c1", [message("a"), message("b")]);

  const taken = takeUnlogged().get("c1") ?? [];
  expect(taken.map((e) => (e as FeedMessage).message_id)).toStrictEqual([
    "a",
    "b",
    "c",
  ]);
});

test("queued entries land together and before any later change", () => {
  ensureFeed("q1");
  queueItem("q1", message("a"));
  queueItem("q1", message("b"));
  expect(feeds.q1?.messages).toHaveLength(0);
  markMessageDeleted("q1", "a");
  const [a, b] = (feeds.q1?.messages ?? []) as FeedMessage[];
  expect([a?.message_id, a?.deleted, b?.message_id]).toStrictEqual([
    "a",
    true,
    "b",
  ]);
  queueItem("q1", message("c"));
  flushQueued();
  expect(feeds.q1?.messages).toHaveLength(3);
});
