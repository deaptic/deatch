import { ensureFeed, feeds, setFeeds, updateFeed } from "./core.ts";
import { enforceCaps } from "./caps.ts";
import type {
  AutomodHoldStatus,
  BadgeMap,
  FeedEntry,
  FeedEvent,
  FeedMessage,
  Person,
  Redemption,
  SuspiciousInfo,
} from "../../types/index.ts";

/// Changes the first entry `find` picks; false when there is none.
function updateFirst<T extends FeedEntry>(
  broadcasterId: string,
  find: (entry: FeedEntry) => entry is T,
  change: (entry: T) => void,
): boolean {
  let found = false;
  updateFeed(broadcasterId, (f) => {
    const entry = f.messages.find(find);
    if (entry) {
      change(entry);
      found = true;
    }
  });
  return found;
}

/// Changes every entry `find` picks.
function updateEach<T extends FeedEntry>(
  broadcasterId: string,
  find: (entry: FeedEntry) => entry is T,
  change: (entry: T) => void,
) {
  updateFeed(broadcasterId, (f) => {
    for (const entry of f.messages) if (find(entry)) change(entry);
  });
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
export function markMessageDeleted(broadcasterId: string, messageId: string) {
  updateFirst(
    broadcasterId,
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
  broadcasterId: string,
  userId: string,
  sourceId?: string,
) {
  updateEach(
    broadcasterId,
    (e): e is FeedMessage =>
      e.kind === "message" &&
      e.chatter_user_id === userId &&
      (!sourceId || e.source?.id === sourceId),
    (m) => {
      m.deleted = true;
    },
  );
}

export function markAllMessagesDeleted(broadcasterId: string) {
  updateEach(
    broadcasterId,
    (e): e is FeedMessage => e.kind === "message",
    (m) => {
      m.deleted = true;
    },
  );
}

export function setPaused(broadcasterId: string, paused: boolean) {
  ensureFeed(broadcasterId);
  setFeeds(broadcasterId, "paused", paused);
}

export function setBadges(broadcasterId: string, badges: BadgeMap) {
  if (!feeds[broadcasterId]) return;
  setFeeds(broadcasterId, "badges", badges);
}

export function trimToLatest(broadcasterId: string) {
  ensureFeed(broadcasterId);
  updateFeed(broadcasterId, (f) => {
    enforceCaps(f.messages);
    f.paused = false;
  });
}

export function dropFeed(broadcasterId: string) {
  setFeeds(broadcasterId, undefined);
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
