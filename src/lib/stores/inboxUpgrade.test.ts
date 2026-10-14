/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { upgradeMention } from "./inboxUpgrade.ts";

const legacy = {
  id: "m1",
  channelId: "c1",
  channelLogin: "chan",
  channelName: "Chan",
  messageId: "m1",
  chatterId: "u1",
  chatterLogin: "foo",
  chatterName: "Foo",
  chatterColor: "#f00",
  fragments: [{ type: "text" as const, text: "hi" }],
  reason: { kind: "mention" as const },
  timestamp: 5,
  unread: true,
};

Deno.test("rebuilds a legacy mention into a message", () => {
  const m = upgradeMention(legacy)!;
  assertEquals(m.message.message_id, "m1");
  assertEquals(m.message.chatter_name, "Foo");
  assertEquals(m.message.fragments, legacy.fragments);
  assertEquals(m.unread, true);
});

Deno.test("passes current mentions through and drops unrenderable ones", () => {
  const current = upgradeMention(legacy)!;
  assertEquals(upgradeMention(current), current);
  assertEquals(upgradeMention({ id: "x", timestamp: 1 }), null);
});
