import { expect, test } from "vite-plus/test";
import type { Stream } from "../../shared/types/index.ts";
import type { RawNotification } from "../../platform/twitch/eventsubPayloads.ts";
import { LIVE_FRESH_MS, newlyLive, supportAlert } from "./model.ts";

const NOW = Date.parse("2026-01-01T12:00:00Z");

const stream = (id: string, userId: string, startedMsAgo: number): Stream =>
  ({
    id,
    user: { id: userId, login: userId, displayName: userId },
    startedAt: new Date(NOW - startedMsAgo).toISOString(),
  }) as Stream;

test("only watched channels that just started and weren't seen count as newly live", () => {
  const streams = [
    stream("s1", "a", 1_000),
    stream("s2", "b", 1_000),
    stream("s3", "c", 1_000),
    stream("s4", "a2", LIVE_FRESH_MS + 1),
  ];
  const watched = new Set(["a", "b", "a2"]);
  expect(
    newlyLive(streams, watched, new Set(["s2"]), NOW).map((s) => s.id),
  ).toStrictEqual(["s1"]);
});

const notice = (type: string, extra: object = {}): RawNotification =>
  ({
    broadcaster_user_id: "me",
    message_id: "m",
    notice_type: type,
    system_message: "",
    chatter_user_name: "Viewer1",
    ...extra,
  }) as RawNotification;

test("subs and gifts become alerts, gifts inside a community gift do not", () => {
  expect(supportAlert(notice("sub"))?.key).toBe("ALERTS_SUB_TOAST");
  expect(supportAlert(notice("resub"))?.key).toBe("ALERTS_RESUB_TOAST");
  expect(
    supportAlert(
      notice("sub_gift", {
        sub_gift: { recipient_user_name: "Viewer2", community_gift_id: null },
      }),
    ),
  ).toMatchObject({
    key: "ALERTS_GIFT_TOAST",
    values: { recipient: "Viewer2" },
  });
  expect(
    supportAlert(
      notice("sub_gift", {
        sub_gift: { recipient_user_name: "Viewer2", community_gift_id: "g" },
      }),
    ),
  ).toBeNull();
  expect(
    supportAlert(
      notice("community_sub_gift", { community_sub_gift: { total: 5 } }),
    ),
  ).toMatchObject({ key: "ALERTS_COMMUNITY_GIFT_TOAST", values: { count: 5 } });
  expect(supportAlert(notice("raid"))).toBeNull();
});
