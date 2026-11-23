import { expect, test } from "vite-plus/test";
import type { FeedMessage } from "../../../lib/types/index.ts";
import { textOf, withoutReplyMention } from "./message.ts";

const reply = (fragments: FeedMessage["fragments"]): FeedMessage =>
  ({ fragments, reply: { parent_user_login: "viewer1" } }) as FeedMessage;

test("textOf joins fragments without separators", () => {
  expect(
    textOf({
      fragments: [
        { type: "text", text: "a " },
        { type: "text", text: "b" },
      ],
    }),
  ).toBe("a b");
});

test("withoutReplyMention drops the leading @parent and its space", () => {
  const msg = reply([
    { type: "mention", text: "@viewer1", user_login: "viewer1" },
    { type: "text", text: " hi" },
  ]);
  expect(withoutReplyMention(msg)).toStrictEqual([
    { type: "text", text: "hi" },
  ]);
});

test("withoutReplyMention keeps mentions of someone else", () => {
  const msg = reply([
    { type: "mention", text: "@viewer2", user_login: "viewer2" },
  ]);
  expect(withoutReplyMention(msg)).toStrictEqual(msg.fragments);
  expect(withoutReplyMention(reply([]))).toStrictEqual([]);
});
