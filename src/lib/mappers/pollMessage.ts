import { formatSpan } from "../../shared/format/duration.ts";
import { formatList } from "../../shared/format/list.ts";
import { t } from "../../shared/i18n/index.ts";
import type { NoticeText, RawPoll } from "../types/index.ts";

export function pollBegin(raw: RawPoll): NoticeText {
  return {
    text: t("FEED_POLL_STARTED_LINE", {
      title: raw.title,
      duration: formatSpan(raw.started_at, raw.ends_at ?? raw.started_at),
    }),
    detail: t("FEED_POLL_CHOICES_LINE", {
      choices: formatList(raw.choices.map((c) => c.title)),
    }),
  };
}

export function pollEnd(raw: RawPoll): NoticeText | null {
  if (raw.status === "archived") return null;
  const results = [...raw.choices]
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .map((c) =>
      t("FEED_POLL_CHOICE_VOTES_VALUE", {
        choice: c.title,
        votes: c.votes ?? 0,
      }),
    );
  return {
    text: t("FEED_POLL_ENDED_LINE", {
      early: String(raw.status === "terminated"),
      title: raw.title,
    }),
    detail: t("FEED_POLL_RESULTS_LINE", { results: formatList(results) }),
  };
}
