// Pure text for creator goal events, kept apart from the listener so it can
// be tested without Tauri.

import { t } from "../i18n/index.ts";
import type { RawGoal } from "../types/twitch/eventsub.ts";
import { withDetail } from "../utils/feedEvent.ts";

function amounts(raw: RawGoal) {
  return {
    type: raw.type,
    current: raw.current_amount,
    target: raw.target_amount,
  };
}

export function goalBegin(raw: RawGoal): string {
  return withDetail(t("GOAL_BEGIN", amounts(raw)), raw.description);
}

export function goalEnd(raw: RawGoal): string {
  return withDetail(
    t("GOAL_END", { ...amounts(raw), achieved: String(!!raw.is_achieved) }),
    raw.description,
  );
}
