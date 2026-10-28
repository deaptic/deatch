import { produce } from "solid-js/store";
import { type ChannelFeed, ensureFeed, feeds, setFeeds } from "./core.ts";
import { enforceCaps } from "./caps.ts";
import type {
  BadgeMap,
  FeedEntry,
  FeedEvent,
  FeedMessage,
  Person,
  Redemption,
  SuspiciousInfo,
} from "../../types/feed.ts";
import type { AutomodHoldStatus } from "../../types/index.ts";

/// Changes the first entry `find` picks; false when there is none.
function updateFirst<T extends FeedEntry>(
  channel: string,
  find: (entry: FeedEntry) => entry is T,
  change: (entry: T) => void,
): boolean {
  if (!feeds[channel]) return false;
  let found = false;
  setFeeds(
    channel,
    produce((f) => {
      const entry = f.messages.find(find);
      if (entry) {
        change(entry);
        found = true;
      }
    }),
  );
  return found;
}

/// Changes every entry `find` picks.
function updateEach<T extends FeedEntry>(
  channel: string,
  find: (entry: FeedEntry) => entry is T,
  change: (entry: T) => void,
) {
  if (!feeds[channel]) return;
  setFeeds(
    channel,
    produce((f) => {
      for (const entry of f.messages) if (find(entry)) change(entry);
    }),
  );
}

const messageWithId =
  (id: string) =>
  (e: FeedEntry): e is FeedMessage =>
    e.kind === "message" && e.message_id === id;

const eventWithId =
  (id: string) =>
  (e: FeedEntry): e is FeedEvent =>
    e.kind === "event" && e.id === id;

/// Matches this channel's copy of a message or, in shared chat, the original
/// it was copied from.
export function markMessageDeleted(id: string, messageId: string) {
  updateFirst(
    id,
    (e): e is FeedMessage =>
      e.kind === "message" &&
      (e.message_id === messageId || e.source?.messageId === messageId),
    (m) => {
      m.deleted = true;
    },
  );
}

/// With `sourceId`, only the user's messages sent in that shared chat channel.
export function markUserMessagesDeleted(
  id: string,
  userId: string,
  sourceId?: string,
) {
  updateEach(
    id,
    (e): e is FeedMessage =>
      e.kind === "message" &&
      e.chatter_user_id === userId &&
      (!sourceId || e.source?.id === sourceId),
    (m) => {
      m.deleted = true;
    },
  );
}

export function markAllMessagesDeleted(id: string) {
  updateEach(
    id,
    (e): e is FeedMessage => e.kind === "message",
    (m) => {
      m.deleted = true;
    },
  );
}

export function setPaused(id: string, paused: boolean) {
  ensureFeed(id);
  setFeeds(id, "paused", paused);
}

export function setBadges(id: string, badges: BadgeMap) {
  if (!feeds[id]) return;
  setFeeds(id, "badges", badges);
}

export function trimToLatest(id: string) {
  ensureFeed(id);
  setFeeds(
    id,
    produce((f) => {
      enforceCaps(f.messages);
      f.paused = false;
    }),
  );
}

export function dropFeed(id: string) {
  setFeeds(id, undefined as unknown as ChannelFeed);
}

export function setChannelPointsRedemption(
  broadcasterId: string,
  messageId: string,
  redemption: Redemption,
) {
  updateFirst(broadcasterId, messageWithId(messageId), (m) => {
    if (m.channel_points?.kind === "custom_reward") {
      m.channel_points.redemption = redemption;
    }
  });
}

/// False when the message is not in the feed.
export function setSuspicious(
  broadcasterId: string,
  messageId: string,
  info: SuspiciousInfo,
): boolean {
  return updateFirst(broadcasterId, messageWithId(messageId), (m) => {
    m.suspicious = info;
  });
}

export function addGiftRecipient(
  broadcasterId: string,
  eventId: string,
  recipient: Person,
) {
  updateFirst(broadcasterId, eventWithId(eventId), (e) => {
    e.recipients = [...(e.recipients ?? []), recipient];
  });
}

export function setAutomodHoldStatus(
  broadcasterId: string,
  messageId: string,
  status: AutomodHoldStatus,
  moderator?: string,
) {
  updateFirst(broadcasterId, messageWithId(messageId), (m) => {
    if (!m.automod_hold) return;
    m.automod_hold.status = status;
    if (moderator) m.automod_hold.moderator = moderator;
  });
}
