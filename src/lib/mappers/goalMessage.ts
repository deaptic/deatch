import { t } from "../../shared/i18n/index.ts";
import type { NoticeText, RawGoal } from "../types/index.ts";
import { noticeText } from "../utils/feedEvent.ts";

function amounts(raw: RawGoal) {
  return {
    type: raw.type,
    current: raw.current_amount,
    target: raw.target_amount,
  };
}

export function goalBegin(raw: RawGoal): NoticeText {
  return noticeText(t("FEED_GOAL_STARTED_LINE", amounts(raw)), raw.description);
}

export function goalEnd(raw: RawGoal): NoticeText {
  return noticeText(
    t("FEED_GOAL_ENDED_LINE", {
      ...amounts(raw),
      achieved: String(!!raw.is_achieved),
    }),
    raw.description,
  );
}
