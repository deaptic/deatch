import { expect, test } from "vite-plus/test";
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

test("rebuilds a legacy mention into a message", () => {
  const m = upgradeMention(legacy)!;
  expect(m.message.message_id).toStrictEqual("m1");
  expect(m.message.chatter_name).toStrictEqual("Foo");
  expect(m.message.fragments).toStrictEqual(legacy.fragments);
  expect(m.unread).toStrictEqual(true);
});

test("passes current mentions through and drops unrenderable ones", () => {
  const current = upgradeMention(legacy)!;
  expect(upgradeMention(current)).toStrictEqual(current);
  expect(upgradeMention({ id: "x", timestamp: 1 })).toStrictEqual(null);
});
