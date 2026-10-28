// Pure text for creator goal events, kept apart from the listener so it can
// be tested without Tauri.

import { t } from "../i18n/index.ts";
import type { RawGoal } from "../types/twitch/eventsub.ts";
import { noticeText } from "../utils/feedEvent.ts";
import type { NoticeText } from "../types/feed.ts";

function amounts(raw: RawGoal) {
  return {
    type: raw.type,
    current: raw.current_amount,
    target: raw.target_amount,
  };
}

export function goalBegin(raw: RawGoal): NoticeText {
  return noticeText(t("GOAL_BEGIN", amounts(raw)), raw.description);
}

export function goalEnd(raw: RawGoal): NoticeText {
  return noticeText(
    t("GOAL_END", { ...amounts(raw), achieved: String(!!raw.is_achieved) }),
    raw.description,
  );
}
