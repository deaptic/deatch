import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../../../lib/types/index.ts";
import { giftGroup, groupGifts } from "./giftGroup.ts";
import { feedEvent } from "./feedEvent.ts";
import { at } from "../../../lib/utils/at.ts";

const mapped = (raw: RawNotification) => ({
  raw,
  item: feedEvent(raw.notice_type, raw.message_id, 0, { id: raw.message_id }),
});

const sub = (id: string, recipient: string, giftId: string | null) =>
  mapped(
    notice({
      message_id: id,
      notice_type: "sub_gift",
      sub_gift: {
        sub_tier: "1000",
        recipient_user_id: `id-${recipient}`,
        recipient_user_login: recipient.toLowerCase(),
        recipient_user_name: recipient,
        cumulative_total: null,
        community_gift_id: giftId,
      },
    }),
  );

test("folds a batch's gifted subs into their community gift", () => {
  const community = mapped(
    notice({
      message_id: "c1",
      notice_type: "community_sub_gift",
      community_sub_gift: {
        id: "g1",
        sub_tier: "1000",
        total: 2,
        cumulative_total: null,
      },
    }),
  );
  const rows = groupGifts([
    community,
    sub("s1", "Viewer2", "g1"),
    sub("s2", "Viewer3", "g1"),
    sub("s3", "Viewer4", null),
    sub("s4", "Viewer5", "g9"),
  ]);
  expect(rows.map((r) => r.id)).toStrictEqual(["c1", "s3", "s4"]);
  expect(at(rows, 0).recipients).toStrictEqual([
    { id: "id-Viewer2", login: "viewer2", name: "Viewer2" },
    { id: "id-Viewer3", login: "viewer3", name: "Viewer3" },
  ]);
  expect(community.item.recipients).toBeUndefined();
});

const notice = (n: Partial<RawNotification>): RawNotification => ({
  broadcaster_user_id: "1",
  message_id: "n1",
  notice_type: "",
  system_message: "",
  ...n,
});

test("ties a community gift and its subs together", () => {
  expect(
    giftGroup(
      notice({
        notice_type: "community_sub_gift",
        community_sub_gift: {
          id: "g1",
          sub_tier: "1000",
          total: 5,
          cumulative_total: null,
        },
      }),
    ),
  ).toStrictEqual({ role: "community", giftId: "g1" });
  expect(
    giftGroup(
      notice({
        notice_type: "shared_chat_sub_gift",
        shared_chat_sub_gift: {
          sub_tier: "1000",
          recipient_user_id: null,
          recipient_user_login: "viewer2",
          recipient_user_name: "Viewer2",
          cumulative_total: null,
          community_gift_id: "g1",
        },
      }),
    ),
  ).toStrictEqual({
    role: "member",
    giftId: "g1",
    recipient: { id: undefined, login: "viewer2", name: "Viewer2" },
  });
});

test("leaves a direct gift on its own", () => {
  expect(
    giftGroup(
      notice({
        notice_type: "sub_gift",
        sub_gift: {
          sub_tier: "1000",
          recipient_user_login: "viewer2",
          recipient_user_name: "Viewer2",
          cumulative_total: null,
          community_gift_id: null,
        },
      }),
    ),
  ).toBeNull();
});
