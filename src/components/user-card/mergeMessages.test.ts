/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { FeedMessage } from "../../lib/types/index.ts";
import { mergeMessages } from "./mergeMessages.ts";

const msg = (message_id: string, chatter_user_id = "a") =>
  ({ message_id, chatter_user_id }) as FeedMessage;
const ids = (list: FeedMessage[]) => list.map((m) => m.message_id);

Deno.test("puts history before live and drops the overlap", () => {
  const merged = mergeMessages([msg("1"), msg("2")], [msg("2"), msg("3")], "a");
  assertEquals(ids(merged), ["1", "2", "3"]);
});

Deno.test("drops history left over from the previous chatter", () => {
  const merged = mergeMessages([msg("1", "old")], [msg("2", "a")], "a");
  assertEquals(ids(merged), ["2"]);
});
