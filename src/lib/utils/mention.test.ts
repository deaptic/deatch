/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { FeedMessage } from "../types/feed.ts";
import { isMention, mentionReason } from "./mention.ts";

const message = (overrides: Partial<FeedMessage>): FeedMessage =>
  ({
    chatter_login: "bob",
    fragments: [{ type: "text", text: "hello there" }],
    ...overrides,
  }) as FeedMessage;

Deno.test("mentions, replies and keywords count; own messages never do", () => {
  const mention = message({
    fragments: [{ type: "mention", text: "@Me", user_login: "me" }],
  });
  assertEquals(isMention(mention, "Me", []), true);
  assertEquals(
    isMention(message({ chatter_login: "me" }), "me", ["hello"]),
    false,
  );
  assertEquals(
    isMention(
      message({ reply: { parent_user_login: "me" } as FeedMessage["reply"] }),
      "me",
      [],
    ),
    true,
  );
  assertEquals(isMention(message({}), "me", ["there"]), true);
  assertEquals(isMention(message({}), "me", []), false);
});

Deno.test("mentionReason names the matched keyword", () => {
  assertEquals(mentionReason(message({}), "me", ["nope", "the*"]), {
    kind: "keyword",
    term: "the*",
  });
  assertEquals(mentionReason(message({}), "me", []), null);
});
