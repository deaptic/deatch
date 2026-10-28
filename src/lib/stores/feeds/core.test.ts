import { expect, test } from "vite-plus/test";
import { unwrap } from "solid-js/store";
import type { FeedEntry, FeedMessage } from "../../types/index.ts";
import { ensureFeed, takeUnlogged } from "./core.ts";
import { appendItem } from "./write.ts";
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
