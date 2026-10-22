// Pure mapper for channel.bits.use, kept apart from the listener so it can be
// tested without Tauri.

import { t } from "../i18n/index.ts";
import type { FeedEvent, Fragment } from "../types/feed.ts";
import type { RawBitsUse } from "../types/twitch/eventsub.ts";
import { chatterFields, feedEvent } from "../utils/feedEvent.ts";
import { BITS_USE } from "../constants/events.ts";
import { mapFragment } from "./chat-mapper.ts";

// These arrive as a chat message of their own, which already shows them.
const MESSAGE_POWER_UPS = new Set(["message_effect", "gigantify_an_emote"]);

function shownElsewhere(raw: RawBitsUse): boolean {
  return raw.type === "cheer" ||
    (raw.type === "power_up" &&
      MESSAGE_POWER_UPS.has(raw.power_up?.type ?? ""));
}

function fragments(raw: RawBitsUse): Fragment[] | undefined {
  const emote = raw.power_up?.emote;
  if (emote) return [{ type: "emote", text: emote.name, id: emote.id }];
  return raw.message?.text.trim()
    ? raw.message.fragments.map(mapFragment)
    : undefined;
}

/// Null for bits a chat message already shows.
export function mapBitsUse(
  raw: RawBitsUse,
  timestamp: number,
): FeedEvent | null {
  if (shownElsewhere(raw)) return null;
  return feedEvent(
    BITS_USE,
    t("EVENT_BITS_USE", {
      user: raw.user_name,
      bits: raw.bits,
      kind: raw.type === "power_up" ? raw.power_up?.type ?? "" : raw.type,
      title: raw.custom_power_up?.title ?? "",
    }),
    timestamp,
    {
      ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
      message: fragments(raw),
    },
  );
}
