import { expect, test } from "vite-plus/test";
import type { FeedEntry } from "../../types/index.ts";
import { append, insert, prepend } from "./ops.ts";
import { getEntryId } from "../../utils/entryId.ts";

const message = (id: string, timestamp: number): FeedEntry =>
  ({ kind: "message", message_id: id, timestamp }) as unknown as FeedEntry;

const ids = (items: FeedEntry[]) => items.map(getEntryId);

test("append drops duplicates", () => {
  const feed = [message("a", 1)];
  expect(append(feed, message("a", 2), false)).toBe(false);
  expect(append(feed, message("b", 2), false)).toBe(true);
  expect(ids(feed)).toStrictEqual(["a", "b"]);
});

test("insert merges by timestamp and skips known ids", () => {
  const feed = [message("a", 1), message("d", 4)];
  const added = insert(
    feed,
    [message("c", 3), message("a", 1), message("b", 2)],
    false,
  );
  expect(ids(added)).toStrictEqual(["b", "c"]);
  expect(ids(feed)).toStrictEqual(["a", "b", "c", "d"]);
});

test("prepend puts older entries first, oldest to newest", () => {
  const feed = [message("c", 3)];
  const added = prepend(
    feed,
    [message("b", 2), message("a", 1), message("c", 3)],
    false,
  );
  expect(ids(added)).toStrictEqual(["a", "b"]);
  expect(ids(feed)).toStrictEqual(["a", "b", "c"]);
});
