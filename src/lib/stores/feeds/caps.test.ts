/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
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

Deno.test("keeps the newest entries per category", () => {
  const items = [
    notice(0),
    ...Array.from({ length: 401 }, (_, i) => message(i)),
  ];
  enforceCaps(items);
  assertEquals(items.length, 401);
  assertEquals(ids(items)[0], "e0");
  assertEquals(ids(items)[1], "m1");
});

Deno.test("paused feeds keep more but still have a ceiling", () => {
  const items = Array.from({ length: 2500 }, (_, i) => message(i));
  enforceCaps(items, true);
  assertEquals(items.length, 2000);
  assertEquals(ids(items)[0], "m500");
});
