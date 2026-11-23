import { t } from "../../../shared/i18n/index.ts";
import type {
  FeedEvent,
  Fragment,
  RawBitsUse,
} from "../../../shared/types/index.ts";
import { chatterFields, feedEvent } from "./feedEvent.ts";
import { BITS_USE } from "../../../shared/moderateActions.ts";
import { wordsOf } from "./chat.ts";

const MESSAGE_POWER_UPS = new Set(["message_effect", "gigantify_an_emote"]);

function shownElsewhere(raw: RawBitsUse): boolean {
  return (
    raw.type === "cheer" ||
    (raw.type === "power_up" && MESSAGE_POWER_UPS.has(raw.power_up?.type ?? ""))
  );
}

function fragments(raw: RawBitsUse): Fragment[] | undefined {
  const emote = raw.power_up?.emote;
  if (emote) return [{ type: "emote", text: emote.name, id: emote.id }];
  return wordsOf(raw.message);
}

export function mapBitsUse(
  raw: RawBitsUse,
  timestamp: number,
): FeedEvent | null {
  if (shownElsewhere(raw)) return null;
  return feedEvent(
    BITS_USE,
    t("FEED_BITS_USED_LINE", {
      user: raw.user_name,
      bits: raw.bits,
      kind: raw.type === "power_up" ? (raw.power_up?.type ?? "") : raw.type,
      title: raw.custom_power_up?.title ?? "",
    }),
    timestamp,
    {
      ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
      message: fragments(raw),
    },
  );
}
