import { expect, test } from "vite-plus/test";
import type { FeedEntry } from "../../types/feed.ts";
import { enforceCaps } from "./caps.ts";

const message = (n: number): FeedEntry =>
  ({ kind: "message", message_id: `m${n}` }) as unknown as FeedEntry;
const notice = (n: number): FeedEntry =>
  ({
    kind: "event",
    id: `e${n}`,
    notice_type: "local",
  }) as unknown as FeedEntry;

const ids = (items: FeedEntry[]) =>
  items.map((m) => (m.kind === "message" ? m.message_id : m.id));

test("keeps the newest entries per category", () => {
  const items = [
    notice(0),
    ...Array.from({ length: 401 }, (_, i) => message(i)),
  ];
  enforceCaps(items);
  expect(items.length).toStrictEqual(401);
  expect(ids(items)[0]).toStrictEqual("e0");
  expect(ids(items)[1]).toStrictEqual("m1");
});

test("paused feeds keep more but still have a ceiling", () => {
  const items = Array.from({ length: 2500 }, (_, i) => message(i));
  enforceCaps(items, true);
  expect(items.length).toStrictEqual(2000);
  expect(ids(items)[0]).toStrictEqual("m500");
});
