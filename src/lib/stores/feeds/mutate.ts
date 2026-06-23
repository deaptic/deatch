import { produce } from "solid-js/store";
import {
  type ChannelFeed,
  enforceCaps,
  ensureFeed,
  feeds,
  setFeeds,
} from "./core.ts";
import type { BadgeMap } from "../../types/feed.ts";
import type { AutomodHoldStatus } from "../../types/index.ts";

export function markMessageDeleted(id: string, messageId: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      const m = f.messages.find((m) =>
        m.kind === "message" && m.message_id === messageId
      );
      if (m && m.kind === "message") m.deleted = true;
    }),
  );
}

export function markUserMessagesDeleted(id: string, userId: string) {
  if (!feeds[id]) return;
  setFeeds(
    id,
    produce((f) => {
      for (const m of f.messages) {
        if (m.kind === "message" && m.chatter_user_id === userId) {
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
  ensureFeed(id);
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

export function setChannelPointsRewardTitle(
  broadcasterId: string,
  messageId: string,
  title: string,
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
        item.channel_points.title = title;
      }
    }),
  );
}

export function setAutomodHoldStatus(
  broadcasterId: string,
  messageId: string,
  status: AutomodHoldStatus,
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
      }
    }),
  );
}
