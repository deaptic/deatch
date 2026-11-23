import { expect, test } from "vite-plus/test";
import type { FeedMessage } from "../../lib/types/index.ts";
import { mergeMessages } from "./mergeMessages.ts";

const msg = (message_id: string, chatter_user_id = "a") =>
  ({ message_id, chatter_user_id }) as FeedMessage;
const ids = (list: FeedMessage[]) => list.map((m) => m.message_id);

test("puts history before live and drops the overlap", () => {
  const merged = mergeMessages([msg("1"), msg("2")], [msg("2"), msg("3")], "a");
  expect(ids(merged)).toStrictEqual(["1", "2", "3"]);
});

test("drops history left over from the previous chatter", () => {
  const merged = mergeMessages([msg("1", "old")], [msg("2", "a")], "a");
  expect(ids(merged)).toStrictEqual(["2"]);
});
