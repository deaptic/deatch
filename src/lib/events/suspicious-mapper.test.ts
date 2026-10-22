/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type {
  RawSuspiciousUserMessage,
  RawSuspiciousUserUpdate,
} from "../types/twitch/eventsub.ts";
import { formatSuspicious } from "../format/suspicious.ts";
import { suspiciousInfo, suspiciousUpdate } from "./suspicious-mapper.ts";

const user = { user_id: "2", user_login: "foo", user_name: "Foo" };

const message = (
  m: Partial<RawSuspiciousUserMessage>,
): RawSuspiciousUserMessage => ({
  ...user,
  broadcaster_user_id: "1",
  low_trust_status: "restricted",
  types: [],
  ban_evasion_evaluation: "unknown",
  message: { message_id: "m1", text: "hi", fragments: [] },
  ...m,
});

Deno.test("explains why a chatter is flagged", () => {
  const info = suspiciousInfo(message({
    ban_evasion_evaluation: "likely",
    types: ["banned_in_shared_channel"],
  }));
  assertEquals(
    info && formatSuspicious(info),
    "Restricted chatter, only mods see this, likely ban evader, banned in a shared channel",
  );
  assertEquals(suspiciousInfo(message({ low_trust_status: "none" })), null);
});

Deno.test("describes a mod changing a chatter's status", () => {
  const raw: RawSuspiciousUserUpdate = {
    ...user,
    broadcaster_user_id: "1",
    moderator_user_id: "9",
    moderator_user_login: "mod",
    moderator_user_name: "Mod",
    low_trust_status: "active_monitoring",
  };
  assertEquals(suspiciousUpdate(raw), {
    text: "Mod started monitoring Foo",
    people: [
      { id: "9", login: "mod", name: "Mod" },
      { id: "2", login: "foo", name: "Foo" },
    ],
  });
});
