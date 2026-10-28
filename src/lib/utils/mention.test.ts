import { expect, test } from "vite-plus/test";
import type { FeedMessage } from "../types/index.ts";
import { isMention, mentionReason } from "./mention.ts";

const message = (overrides: Partial<FeedMessage>): FeedMessage =>
  ({
    chatter_login: "bob",
    fragments: [{ type: "text", text: "hello there" }],
    ...overrides,
  }) as FeedMessage;

test("mentions, replies and keywords count; own messages never do", () => {
  const mention = message({
    fragments: [{ type: "mention", text: "@Me", user_login: "me" }],
  });
  expect(isMention(mention, "Me", [])).toBe(true);
  expect(isMention(message({ chatter_login: "me" }), "me", ["hello"])).toBe(
    false,
  );
  expect(
    isMention(
      message({ reply: { parent_user_login: "me" } as FeedMessage["reply"] }),
      "me",
      [],
    ),
  ).toBe(true);
  expect(isMention(message({}), "me", ["there"])).toBe(true);
  expect(isMention(message({}), "me", [])).toBe(false);
});

test("mentionReason names the matched keyword", () => {
  expect(mentionReason(message({}), "me", ["nope", "the*"])).toStrictEqual({
    kind: "keyword",
    term: "the*",
  });
  expect(mentionReason(message({}), "me", [])).toBeNull();
});
