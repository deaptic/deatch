// Pure text for hype train events, kept apart from the listener so it can be
// tested without Tauri.

import { formatList } from "../format/list.ts";
import { t } from "../i18n/index.ts";
import type { NoticeText, RawHypeTrain } from "../types/index.ts";
import { noticeText } from "../utils/feedEvent.ts";

function contributors(raw: RawHypeTrain): string {
  return formatList(
    raw.top_contributions.map((c) =>
      t("HYPE_TRAIN_CONTRIBUTION", {
        name: c.user_name,
        type: c.type,
        total: c.total,
      }),
    ),
  );
}

export function hypeTrainBegin(raw: RawHypeTrain): string {
  return t("HYPE_TRAIN_BEGIN", { type: raw.type, level: raw.level });
}

/// Null unless the train reached a new level since `lastLevel`.
export function hypeTrainProgress(
  raw: RawHypeTrain,
  lastLevel: number,
): string | null {
  return raw.level > lastLevel
    ? t("HYPE_TRAIN_LEVEL", { level: raw.level })
    : null;
}

export function hypeTrainEnd(raw: RawHypeTrain): NoticeText {
  return noticeText(
    t("HYPE_TRAIN_END", { level: raw.level, total: raw.total }),
    raw.top_contributions.length
      ? t("HYPE_TRAIN_TOP", { contributors: contributors(raw) })
      : null,
  );
}
