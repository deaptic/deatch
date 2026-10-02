/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { FeedEvent, FeedMessage } from "../types/feed.ts";
import { dayLabel, GROUP_WINDOW_MS, layoutFeed } from "./feedLayout.ts";

const T0 = new Date(2026, 9, 1, 10, 0).getTime();

function msg(
  id: string,
  chatter: string,
  timestamp: number,
  extra: Partial<FeedMessage> = {},
): FeedMessage {
  return {
    kind: "message",
    message_id: id,
    chatter_user_id: chatter,
    chatter_login: chatter,
    chatter_name: chatter,
    color: "",
    fragments: [],
    badges: [],
    timestamp,
    ...extra,
  };
}

function event(id: string, timestamp: number): FeedEvent {
  return {
    kind: "event",
    id,
    notice_type: "sub",
    system_message: "",
    chatter_name: "",
    color: "",
    timestamp,
  };
}

const continued = (rows: { continued: boolean }[]) =>
  rows.map((r) => r.continued);

Deno.test("groups consecutive messages from one chatter", () => {
  const rows = layoutFeed([
    msg("1", "maya", T0),
    msg("2", "maya", T0 + 1000),
    msg("3", "leo", T0 + 2000),
    msg("4", "maya", T0 + 3000),
  ], true);
  assertEquals(continued(rows), [false, true, false, false]);
});

Deno.test("never groups when grouping is off", () => {
  const rows = layoutFeed([msg("1", "maya", T0), msg("2", "maya", T0)], false);
  assertEquals(continued(rows), [false, false]);
});

Deno.test("starts a new group after the time window", () => {
  const rows = layoutFeed([
    msg("1", "maya", T0),
    msg("2", "maya", T0 + GROUP_WINDOW_MS),
  ], true);
  assertEquals(continued(rows), [false, false]);
});

Deno.test("replies, holds, rewards and first messages stand alone", () => {
  const rows = layoutFeed([
    msg("1", "maya", T0),
    msg("2", "maya", T0, {
      reply: {
        parent_message_id: "x",
        parent_message_body: "",
        parent_user_name: "",
        parent_user_login: "",
        parent_user_id: "",
      },
    }),
    msg("3", "maya", T0, { channel_points: { kind: "highlight" } }),
    msg("4", "maya", T0, {
      automod_hold: {
        reason: "",
        status: "pending",
        broadcaster_user_id: "b",
      },
    }),
    msg("5", "maya", T0),
  ], true);
  assertEquals(continued(rows), [false, false, false, false, false]);
});

Deno.test("measures the window from the group's first message", () => {
  const step = GROUP_WINDOW_MS / 2;
  const rows = layoutFeed([
    msg("1", "maya", T0),
    msg("2", "maya", T0 + step),
    msg("3", "maya", T0 + step * 2),
    msg("4", "maya", T0 + step * 3),
  ], true);
  assertEquals(continued(rows), [false, true, false, true]);
});

Deno.test("cheers stand alone", () => {
  const rows = layoutFeed([
    msg("1", "maya", T0),
    msg("2", "maya", T0, { cheer: { bits: 100 } }),
    msg("3", "maya", T0),
  ], true);
  assertEquals(continued(rows), [false, false, true]);
});

Deno.test("events break a group", () => {
  const rows = layoutFeed([
    msg("1", "maya", T0),
    event("e", T0),
    msg("2", "maya", T0),
  ], true);
  assertEquals(continued(rows), [false, false, false]);
});

Deno.test("marks the first row of each new day and breaks groups there", () => {
  const late = new Date(2026, 8, 30, 23, 59).getTime();
  const early = new Date(2026, 9, 1, 0, 1).getTime();
  const rows = layoutFeed([
    msg("1", "maya", late),
    msg("2", "maya", early),
    msg("3", "maya", early),
  ], true);
  assertEquals(rows, [
    { dayStart: false, continued: false },
    { dayStart: true, continued: false },
    { dayStart: false, continued: true },
  ]);
});

Deno.test("labels days relative to now", () => {
  const now = new Date(2026, 9, 1, 12, 0).getTime();
  assertEquals(dayLabel(new Date(2026, 9, 1, 0, 5).getTime(), now), "Today");
  assertEquals(
    dayLabel(new Date(2026, 8, 30, 23, 0).getTime(), now),
    "Yesterday",
  );
  assertEquals(
    dayLabel(new Date(2026, 8, 28, 9, 0).getTime(), now),
    "Monday 28 September",
  );
  assertEquals(
    dayLabel(new Date(2025, 11, 31, 9, 0).getTime(), now),
    "31 December 2025",
  );
});
