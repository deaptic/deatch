import { expect, test } from "vite-plus/test";
import { upgradeMention } from "./upgrade.ts";

const legacy = {
  id: "m1",
  channelId: "c1",
  channelLogin: "broadcaster",
  channelName: "Broadcaster",
  messageId: "m1",
  chatterId: "u1",
  chatterLogin: "viewer1",
  chatterName: "Viewer1",
  chatterColor: "#f00",
  fragments: [{ type: "text" as const, text: "hi" }],
  reason: { kind: "mention" as const },
  timestamp: 5,
  unread: true,
};

test("rebuilds a legacy mention into a message", () => {
  const m = upgradeMention(legacy)!;
  expect(m.message.message_id).toBe("m1");
  expect(m.message.chatter_name).toBe("Viewer1");
  expect(m.message.fragments).toStrictEqual(legacy.fragments);
  expect(m.unread).toBe(true);
});

test("passes current mentions through and drops unrenderable ones", () => {
  const current = upgradeMention(legacy)!;
  expect(upgradeMention(current)).toStrictEqual(current);
  expect(upgradeMention({ id: "x", timestamp: 1 })).toBeNull();
});

test("renames channel fields saved before they were broadcaster fields", () => {
  const { broadcasterId, broadcasterLogin, broadcasterName, ...rest } =
    upgradeMention(legacy)!;
  const saved = {
    ...rest,
    channelId: broadcasterId,
    channelLogin: broadcasterLogin,
    channelName: broadcasterName,
  };
  expect(upgradeMention(saved)).toStrictEqual(upgradeMention(legacy));
  expect(upgradeMention(legacy)).toMatchObject({
    broadcasterId: "c1",
    broadcasterLogin: "broadcaster",
    broadcasterName: "Broadcaster",
  });
});
