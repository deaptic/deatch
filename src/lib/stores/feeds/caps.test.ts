import { expect, test } from "vite-plus/test";
import type { FeedEntry } from "../../types/index.ts";
import { enforceCaps, FEED_CAP } from "./caps.ts";

const message = (n: number): FeedEntry =>
  ({ kind: "message", message_id: `m${n}` }) as unknown as FeedEntry;
const event = (n: number): FeedEntry =>
  ({ kind: "event", id: `e${n}`, notice_type: "raid" }) as unknown as FeedEntry;

const ids = (items: FeedEntry[]) =>
  items.map((m) => (m.kind === "message" ? m.message_id : m.id));

test("drops the oldest entries, messages and events alike", () => {
  const items = [
    event(0),
    ...Array.from({ length: FEED_CAP }, (_, i) => message(i)),
  ];
  enforceCaps(items);
  expect(items.length).toBe(FEED_CAP);
  expect(ids(items)[0]).toBe("m0");
});

test("paused feeds keep more but still have a ceiling", () => {
  const items = Array.from({ length: FEED_CAP * 6 }, (_, i) => message(i));
  enforceCaps(items, true);
  expect(items.length).toBe(FEED_CAP * 5);
  expect(ids(items)[0]).toBe(`m${FEED_CAP}`);
});
