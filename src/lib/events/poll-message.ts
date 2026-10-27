// Pure text for poll events, kept apart from the listener so it can be
// tested without Tauri.

import { formatSpan } from "../format/duration.ts";
import { formatList } from "../format/list.ts";
import { t } from "../i18n/index.ts";
import type { NoticeText } from "../types/feed.ts";
import type { RawPoll } from "../types/twitch/eventsub.ts";

export function pollBegin(raw: RawPoll): NoticeText {
  return {
    text: t("POLL_BEGIN", {
      title: raw.title,
      duration: formatSpan(raw.started_at, raw.ends_at ?? raw.started_at),
    }),
    detail: t("POLL_CHOICES", {
      choices: formatList(raw.choices.map((c) => c.title)),
    }),
  };
}

/// Null for the archive notice Twitch sends after a poll already ended.
export function pollEnd(raw: RawPoll): NoticeText | null {
  if (raw.status === "archived") return null;
  const results = [...raw.choices]
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .map((c) =>
      t("POLL_CHOICE_VOTES", { choice: c.title, votes: c.votes ?? 0 }),
    );
  return {
    text: t("POLL_END", {
      early: String(raw.status === "terminated"),
      title: raw.title,
    }),
    detail: t("POLL_RESULTS", { results: formatList(results) }),
  };
}
