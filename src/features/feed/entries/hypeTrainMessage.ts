import { formatList } from "../../../shared/format/list.ts";
import { t } from "../../../shared/i18n/index.ts";
import type { NoticeText } from "../types.ts";
import type { RawHypeTrain } from "../../../platform/twitch/eventsubPayloads.ts";
import { noticeText, person } from "./feedEvent.ts";

function contributors(raw: RawHypeTrain): string {
  return formatList(
    raw.top_contributions.map((c) =>
      t("FEED_HYPE_TRAIN_CONTRIBUTION_VALUE", {
        name: c.user_name,
        type: c.type,
        total: c.total,
      }),
    ),
  );
}

export function hypeTrainBegin(raw: RawHypeTrain): string {
  return t("FEED_HYPE_TRAIN_STARTED_LINE", {
    type: raw.type,
    level: raw.level,
  });
}

export function hypeTrainProgress(
  raw: RawHypeTrain,
  lastLevel: number,
): string | null {
  return raw.level > lastLevel
    ? t("FEED_HYPE_TRAIN_LEVELED_UP_LINE", { level: raw.level })
    : null;
}

export function hypeTrainEnd(raw: RawHypeTrain): NoticeText {
  return {
    ...noticeText(
      t("FEED_HYPE_TRAIN_ENDED_LINE", { level: raw.level, total: raw.total }),
      raw.top_contributions.length
        ? t("FEED_HYPE_TRAIN_TOP_LINE", { contributors: contributors(raw) })
        : null,
    ),
    people: raw.top_contributions.flatMap((c) =>
      person(c.user_id, c.user_login, c.user_name),
    ),
  };
}
