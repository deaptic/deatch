/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { mapChatSettingsUpdate } from "./chat-settings-mapper.ts";
import type { RawChatSettingsUpdate } from "../types/index.ts";

const OFF: RawChatSettingsUpdate = {
  broadcaster_user_id: "1",
  emote_mode: false,
  follower_mode: false,
  follower_mode_duration_minutes: null,
  slow_mode: false,
  slow_mode_wait_time_seconds: null,
  subscriber_mode: false,
  unique_chat_mode: false,
};

Deno.test("mapChatSettingsUpdate keeps durations of enabled modes", () => {
  assertEquals(
    mapChatSettingsUpdate({
      ...OFF,
      slow_mode: true,
      slow_mode_wait_time_seconds: 30,
      follower_mode: true,
      follower_mode_duration_minutes: 0,
      emote_mode: true,
    }),
    {
      slowModeSeconds: 30,
      followerModeMinutes: 0,
      subscriberMode: false,
      emoteMode: true,
      uniqueChatMode: false,
    },
  );
});

Deno.test("mapChatSettingsUpdate drops durations of disabled modes", () => {
  const settings = mapChatSettingsUpdate({
    ...OFF,
    slow_mode_wait_time_seconds: 30,
    follower_mode_duration_minutes: 10,
  });
  assertEquals(settings.slowModeSeconds, null);
  assertEquals(settings.followerModeMinutes, null);
});
