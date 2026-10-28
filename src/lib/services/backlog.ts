import { t } from "../i18n/index.ts";
import { getRecentMessages } from "../api/twitch/chat.ts";
import { chatterOf, mapChatMessage } from "../mappers/chat-mapper.ts";
import { errorMessage } from "../utils/error.ts";
import { textOf } from "../utils/message.ts";
import {
  appendItem,
  type FeedEntry,
  feeds,
  insertEntries,
  MESSAGE_CAP,
  prependEntries,
} from "../stores/feeds.ts";
import { feedEvent } from "../utils/feedEvent.ts";
import { mapNotice } from "../mappers/notice-mapper.ts";
import { groupGifts } from "../mappers/gift-group.ts";
import type { FeedMessage, RecentHistory } from "../types/index.ts";
import { recordChatter, user } from "../stores/users.ts";
import { appendSentHistoryOlder } from "../stores/chatHistory.ts";
import * as badges from "./badges.ts";

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

/// Backfills messages that arrived while the EventSub socket was down.
/// Pulls from `since` minus a margin; duplicates are dropped on insert.
export function fillGap(
  broadcasterId: string,
  channelLogin: string,
  sinceMs: number,
): Promise<void> {
  return getRecentMessages(
    { channelLogin, limit: GAP_LIMIT, after: sinceMs - GAP_MARGIN_MS },
    { silent: true },
  ).then(
    (history) => {
      const items = entriesOf(history);
      noteChatters(broadcasterId, insertEntries(broadcasterId, items));
      // A full page means robotty dropped the oldest messages of the gap;
      // it keeps the newest `limit`, so the hole sits before the first one.
      const lines = history.messages.length + history.notices.length;
      const first = items[0];
      if (lines >= GAP_LIMIT && first) {
        insertEntries(broadcasterId, [
          feedEvent("local", t("BACKLOG_GAP"), first.timestamp - 1, {
            silent: true,
          }),
        ]);
      }
    },
    () => {},
  );
}

/// One-time hydration of a channel feed with recent history from robotty.
/// The `backfilled` flag in `ChannelFeed` prevents repeats across remounts;
/// a failed fetch leaves it unset so the next visit tries again.
export function load(broadcasterId: string, channelLogin: string) {
  if (feeds[broadcasterId]?.backfilled) return;
  getRecentMessages({ channelLogin, limit: MESSAGE_CAP }, { silent: true })
    .then((history) => {
      const added = prependEntries(broadcasterId, entriesOf(history));
      noteChatters(broadcasterId, added);
      rememberOwnMessages(broadcasterId, added);
    })
    .catch((e) => {
      appendItem(
        broadcasterId,
        feedEvent(
          "local",
          t("BACKLOG_FAILED", { error: errorMessage(e) }),
          Date.now(),
          { id: `backlog-failed-${broadcasterId}`, silent: true },
        ),
      );
    });
}

/// For a user card whose chatter has nothing in the live feed: robotty's
/// deepest page, narrowed to that chatter, held by the card and not the feed.
/// Empty when the page is unavailable.
export function forChatter(
  channelLogin: string,
  chatterId: string,
): Promise<FeedMessage[]> {
  return deepPage(channelLogin).then(
    (history) =>
      history.messages
        .filter((m) => m.chatter_user_id === chatterId)
        .map((m) => mapChatMessage(m, m.timestamp_ms)),
    () => [],
  );
}

/// Shared by every card opened on the channel within PAGE_TTL_MS. A failed
/// fetch is forgotten so the next card retries.
function deepPage(channelLogin: string): Promise<RecentHistory> {
  const now = Date.now();
  for (const [login, entry] of deepPages) {
    if (now - entry.at >= PAGE_TTL_MS) deepPages.delete(login);
  }
  const cached = deepPages.get(channelLogin);
  if (cached) return cached.page;
  const page = getRecentMessages(
    { channelLogin, limit: CHATTER_LIMIT },
    { silent: true },
  ).catch((e) => {
    deepPages.delete(channelLogin);
    throw e;
  });
  deepPages.set(channelLogin, { at: now, page });
  return page;
}

/// Newest first, so the newest backlog entry lands just behind anything
/// already in the sent history.
function rememberOwnMessages(broadcasterId: string, added: FeedEntry[]) {
  const me = user();
  if (!me) return;
  for (const it of added.toReversed()) {
    if (it.kind !== "message" || it.chatter_user_id !== me.id) continue;
    const text = textOf(it);
    if (text) appendSentHistoryOlder(broadcasterId, text);
  }
}
