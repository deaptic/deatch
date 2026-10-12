import { assertEquals } from "@std/assert";
import { parseClientMessage } from "./protocol.ts";

Deno.test("accepts a subscribe message", () => {
  assertEquals(parseClientMessage({ type: "subscribe", twitchIds: ["1"] }), {
    type: "subscribe",
    twitchIds: ["1"],
  });
});

Deno.test("rejects anything else", () => {
  for (
    const body of [
      {},
      { type: "other", twitchIds: [] },
      { type: "subscribe", twitchIds: [1] },
      { type: "subscribe", twitchIds: Array(101).fill("1") },
    ]
  ) {
    assertEquals(parseClientMessage(body), null);
  }
});
