import { t } from "../../shared/i18n/index.ts";
import { getRecentMessages } from "../../platform/twitch/chat.ts";
import { chatterOf, mapChatMessage } from "../mappers/chat.ts";
import { errorMessage } from "../utils/error.ts";
import { textOf } from "../utils/message.ts";
import {
  appendItem,
  feeds,
  insertEntries,
  FEED_CAP,
  prependEntries,
} from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { LOCAL } from "../constants/events.ts";
import { mapNotice } from "../mappers/notice.ts";
import { groupGifts } from "../mappers/giftGroup.ts";
import type { FeedEntry, FeedMessage, RecentHistory } from "../types/index.ts";
import { recordChatter, user } from "../stores/users.ts";
import { appendOlderSentMessage } from "../../features/composer/index.ts";
import * as badges from "../../features/badges/index.ts";

const GAP_MARGIN_MS = 5_000;
const GAP_LIMIT = 300;
const CHATTER_LIMIT = 800;
const PAGE_TTL_MS = 30_000;

const deepPages = new Map<
  string,
  { at: number; page: Promise<RecentHistory> }
>();

function entriesOf(history: RecentHistory): FeedEntry[] {
  return [
    ...history.messages.map((m) => mapChatMessage(m, m.timestamp_ms)),
    ...groupGifts(
      history.notices.flatMap((raw) => {
        const item = mapNotice(raw, raw.timestamp_ms);
        return item ? [{ raw, item }] : [];
      }),
    ),
  ].sort((a, b) => a.timestamp - b.timestamp);
}

function noteChatters(broadcasterId: string, added: FeedEntry[]) {
  for (const it of added) {
    if (it.kind !== "message") continue;
    recordChatter(broadcasterId, chatterOf(it));
    if (it.source) badges.loadSource(it.source);
  }
}

export function fillGap(
  broadcasterId: string,
  broadcasterLogin: string,
  sinceMs: number,
): Promise<void> {
  return getRecentMessages(
    { broadcasterLogin, limit: GAP_LIMIT, after: sinceMs - GAP_MARGIN_MS },
    { silent: true },
  ).then(
    (history) => {
      const items = entriesOf(history);
      noteChatters(broadcasterId, insertEntries(broadcasterId, items));
      const lines = history.messages.length + history.notices.length;
      const first = items[0];
      if (lines >= GAP_LIMIT && first) {
        insertEntries(broadcasterId, [
          feedEvent(LOCAL, t("FEED_HISTORY_GAP_LINE"), first.timestamp - 1, {
            silent: true,
          }),
        ]);
      }
    },
    () => {},
  );
}

export function load(broadcasterId: string, broadcasterLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ broadcasterLogin, limit: FEED_CAP }, { silent: true })
    .then((history) => {
      const added = prependEntries(broadcasterId, entriesOf(history));
      noteChatters(broadcasterId, added);
      rememberOwnMessages(broadcasterId, added);
    })
    .catch((e) => {
      appendItem(
        broadcasterId,
        feedEvent(
          LOCAL,
          t("FEED_HISTORY_FAILED_LINE", { error: errorMessage(e) }),
          Date.now(),
          { id: `backlog-failed-${broadcasterId}`, silent: true },
        ),
      );
    });
}

export function forChatter(
  broadcasterLogin: string,
  chatterId: string,
): Promise<FeedMessage[]> {
  return deepPage(broadcasterLogin).then(
    (history) =>
      history.messages
        .filter((m) => m.chatter_user_id === chatterId)
        .map((m) => mapChatMessage(m, m.timestamp_ms)),
    () => [],
  );
}

function deepPage(broadcasterLogin: string): Promise<RecentHistory> {
  const now = Date.now();
  for (const [login, entry] of deepPages) {
    if (now - entry.at >= PAGE_TTL_MS) deepPages.delete(login);
  }
  const cached = deepPages.get(broadcasterLogin);
  if (cached) return cached.page;
  const page = getRecentMessages(
    { broadcasterLogin, limit: CHATTER_LIMIT },
    { silent: true },
  ).catch((e) => {
    deepPages.delete(broadcasterLogin);
    throw e;
  });
  deepPages.set(broadcasterLogin, { at: now, page });
  return page;
}

function rememberOwnMessages(broadcasterId: string, added: FeedEntry[]) {
  const me = user();
  if (!me) return;
  for (const it of added.toReversed()) {
    if (it.kind !== "message" || it.chatter_user_id !== me.id) continue;
    const text = textOf(it);
    if (text) appendOlderSentMessage(broadcasterId, text);
  }
}
