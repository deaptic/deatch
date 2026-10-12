/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { FeedMessage } from "../types/feed.ts";
import { textOf, withoutReplyMention } from "./message.ts";

const reply = (fragments: FeedMessage["fragments"]): FeedMessage =>
  ({ fragments, reply: { parent_user_login: "bob" } }) as FeedMessage;

Deno.test("textOf joins fragments without separators", () => {
  assertEquals(
    textOf({
      fragments: [{ type: "text", text: "a " }, { type: "text", text: "b" }],
    }),
    "a b",
  );
});

Deno.test("withoutReplyMention drops the leading @parent and its space", () => {
  const msg = reply([
    { type: "mention", text: "@bob", user_login: "bob" },
    { type: "text", text: " hi" },
  ]);
  assertEquals(withoutReplyMention(msg), [{ type: "text", text: "hi" }]);
});

Deno.test("withoutReplyMention keeps mentions of someone else", () => {
  const msg = reply([{ type: "mention", text: "@eve", user_login: "eve" }]);
  assertEquals(withoutReplyMention(msg), msg.fragments);
  assertEquals(withoutReplyMention(reply([])), []);
});
