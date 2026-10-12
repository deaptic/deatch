/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { FeedEntry } from "../../types/feed.ts";
import { append, getEntryId, insert, prepend } from "./ops.ts";

const message = (id: string, timestamp: number): FeedEntry =>
  ({ kind: "message", message_id: id, timestamp }) as unknown as FeedEntry;

const ids = (items: FeedEntry[]) => items.map(getEntryId);

Deno.test("append drops duplicates", () => {
  const feed = [message("a", 1)];
  assertEquals(append(feed, message("a", 2), false), false);
  assertEquals(append(feed, message("b", 2), false), true);
  assertEquals(ids(feed), ["a", "b"]);
});

Deno.test("insert merges by timestamp and skips known ids", () => {
  const feed = [message("a", 1), message("d", 4)];
  const added = insert(feed, [
    message("c", 3),
    message("a", 1),
    message("b", 2),
  ], false);
  assertEquals(ids(added), ["b", "c"]);
  assertEquals(ids(feed), ["a", "b", "c", "d"]);
});

Deno.test("prepend puts older entries first, oldest to newest", () => {
  const feed = [message("c", 3)];
  const added = prepend(feed, [
    message("b", 2),
    message("a", 1),
    message("c", 3),
  ], false);
  assertEquals(ids(added), ["a", "b"]);
  assertEquals(ids(feed), ["a", "b", "c"]);
});
