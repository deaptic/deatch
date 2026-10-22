import { produce } from "solid-js/store";
import { type ChannelFeed, ensureFeed, feeds, setFeeds } from "./core.ts";
import { enforceCaps } from "./caps.ts";
import type {
  BadgeMap,
  GiftRecipient,
  Redemption,
  SuspiciousInfo,
} from "../../types/feed.ts";
import type { AutomodHoldStatus } from "../../types/index.ts";

/// Matches this channel's copy of a message or, in shared chat, the original
/// it was copied from.
export function markMessageDeleted(id: string, messageId: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      const m = f.messages.find((m) =>
        m.kind === "message" &&
        (m.message_id === messageId || m.source?.messageId === messageId)
      );
      if (m && m.kind === "message") m.deleted = true;
    }),
  );
}

/// With `sourceId`, only the user's messages sent in that shared chat channel.
export function markUserMessagesDeleted(
  id: string,
  userId: string,
  sourceId?: string,
) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      for (const m of f.messages) {
        if (
          m.kind === "message" && m.chatter_user_id === userId &&
          (!sourceId || m.source?.id === sourceId)
        ) {
          m.deleted = true;
        }
      }
    }),
  );
}

export function markAllMessagesDeleted(id: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      for (const m of f.messages) {
        if (m.kind === "message") m.deleted = true;
      }
    }),
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
  if (!feeds[broadcasterId]) return;
  setFeeds(
    broadcasterId,
    produce((f) => {
      const item = f.messages.find(
        (m) => m.kind === "message" && m.message_id === messageId,
      );
      if (
        item?.kind === "message" &&
        item.channel_points?.kind === "custom_reward"
      ) {
        item.channel_points.redemption = redemption;
      }
    }),
  );
}

/// False when the message is not in the feed.
export function setSuspicious(
  broadcasterId: string,
  messageId: string,
  info: SuspiciousInfo,
): boolean {
  if (!feeds[broadcasterId]) return false;
  let found = false;
  setFeeds(
    broadcasterId,
    produce((f) => {
      const item = f.messages.find(
        (m) => m.kind === "message" && m.message_id === messageId,
      );
      if (item?.kind === "message") {
        item.suspicious = info;
        found = true;
      }
    }),
  );
  return found;
}

export function addGiftRecipient(
  broadcasterId: string,
  eventId: string,
  recipient: GiftRecipient,
) {
  if (!feeds[broadcasterId]) return;
  setFeeds(
    broadcasterId,
    produce((f) => {
      const item = f.messages.find(
        (m) => m.kind === "event" && m.id === eventId,
      );
      if (item?.kind === "event") {
        item.recipients = [...(item.recipients ?? []), recipient];
      }
    }),
  );
}

export function setAutomodHoldStatus(
  broadcasterId: string,
  messageId: string,
  status: AutomodHoldStatus,
  moderator?: string,
) {
  if (!feeds[broadcasterId]) return;
  setFeeds(
    broadcasterId,
    produce((f) => {
      const item = f.messages.find(
        (m) => m.kind === "message" && m.message_id === messageId,
      );
      if (item && item.kind === "message" && item.automod_hold) {
        item.automod_hold.status = status;
        if (moderator) item.automod_hold.moderator = moderator;
      }
    }),
  );
}
