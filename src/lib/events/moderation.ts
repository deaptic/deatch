import { t } from "../i18n/index.ts";
import {
  listenApp,
  listenEventSub,
  listenFeed,
  serverTime,
  unlistenAll,
} from "./listen.ts";
import type {
  AutomodHoldStatus,
  FeedMessage,
  RawAutomodMessageHold,
  RawAutomodMessageUpdate,
  RawChatClear,
  RawChatClearUserMessages,
  RawChatMessageDelete,
  RawModerate,
  RawSuspiciousUserMessage,
  RawSuspiciousUserUpdate,
  RawUnbanRequestCreate,
  RawUnbanRequestResolve,
  RawWarningAcknowledge,
} from "../types/index.ts";
import {
  appendItem,
  markAllMessagesDeleted,
  markMessageDeleted,
  markUserMessagesDeleted,
  setAutomodHoldStatus,
  setSuspicious,
} from "../stores/feeds.ts";
import { chatterFields, feedEvent, noticeText } from "../utils/feedEvent.ts";
import { isModOfChannel, setModeratedChannels } from "../stores/users.ts";
import { mapFragment } from "./chat-mapper.ts";
import { moderateMessage } from "./moderate-message.ts";
import { automodReason } from "./automod-reason.ts";
import {
  suspiciousInfo,
  suspiciousMessage,
  suspiciousUpdate,
} from "./suspicious-mapper.ts";
import {
  moderateNoticeType,
  SUSPICIOUS_USER,
  UNBAN_REQUEST,
  WARNING_ACKNOWLEDGED,
} from "../constants/events.ts";

/// Twitch strikes a message, or a user's messages, from the partner channel
/// out of the shared feed; local actions arrive as their own delete events.
function applySharedChatAction(p: RawModerate) {
  const here = p.broadcaster_user_id;
  const source = p.source_broadcaster_user_id ?? undefined;
  switch (p.action) {
    case "shared_chat_delete":
      return markMessageDeleted(here, p.shared_chat_delete.message_id);
    case "shared_chat_ban":
      return markUserMessagesDeleted(here, p.shared_chat_ban.user_id, source);
    case "shared_chat_timeout":
      return markUserMessagesDeleted(
        here,
        p.shared_chat_timeout.user_id,
        source,
      );
  }
}

const CHAT_COPY_WAIT_MS = 600;

const HOLD_OUTCOMES: Record<string, AutomodHoldStatus> = {
  approved: "approved",
  denied: "denied",
  expired: "expired",
};

export function start(): () => void {
  return unlistenAll([
    listenApp("moderatedChannelsChanged", setModeratedChannels),
    listenEventSub<RawChatMessageDelete>("channel.chat.message_delete", (e) => {
      const raw = e.event;
      markMessageDeleted(raw.broadcaster_user_id, raw.message_id);
    }),
    listenEventSub<RawChatClearUserMessages>(
      "channel.chat.clear_user_messages",
      (e) => {
        const raw = e.event;
        markUserMessagesDeleted(raw.broadcaster_user_id, raw.target_user_id);
      },
    ),
    listenEventSub<RawChatClear>("channel.chat.clear", (e) => {
      const broadcasterId = e.event.broadcaster_user_id;
      markAllMessagesDeleted(broadcasterId);
      if (isModOfChannel(broadcasterId)) return;
      const now = serverTime(e);
      appendItem(
        broadcasterId,
        feedEvent("chat_cleared", t("EVENT_CHAT_CLEARED"), now, {
          id: `chat-cleared-${broadcasterId}-${now}`,
        }),
      );
    }),
    listenEventSub<RawModerate>("channel.moderate", (e) => {
      const payload = e.event;
      applySharedChatAction(payload);
      const now = serverTime(e);
      const msg = moderateMessage(payload, now);
      if (!msg) return;
      appendItem(
        payload.broadcaster_user_id,
        feedEvent(moderateNoticeType(payload.action), msg, now, {
          chatter_name: payload.moderator_user_name,
        }),
      );
    }),
    listenFeed<RawUnbanRequestCreate>(
      "channel.unban_request.create",
      (raw, timestamp) =>
        feedEvent(
          UNBAN_REQUEST,
          noticeText(
            t("EVENT_UNBAN_REQUEST", { user: raw.user_name }),
            raw.text,
          ),
          timestamp,
          {
            id: `unban-request-${raw.id}`,
            ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
          },
        ),
    ),
    listenFeed<RawUnbanRequestResolve>(
      "channel.unban_request.resolve",
      (raw, timestamp) =>
        // A mod's approve or deny already arrives through channel.moderate.
        raw.status === "canceled"
          ? feedEvent(
              UNBAN_REQUEST,
              t("EVENT_UNBAN_REQUEST_CANCELED", { user: raw.user_name }),
              timestamp,
              {
                ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
              },
            )
          : null,
    ),
    listenFeed<RawWarningAcknowledge>(
      "channel.warning.acknowledge",
      (raw, timestamp) =>
        feedEvent(
          WARNING_ACKNOWLEDGED,
          t("EVENT_WARNING_ACKNOWLEDGED", { user: raw.user_name }),
          timestamp,
          {
            ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
          },
        ),
    ),
    listenEventSub<RawSuspiciousUserMessage>(
      "channel.suspicious_user.message",
      (e) => {
        const raw = e.event;
        const info = suspiciousInfo(raw);
        if (!info) return;
        const id = raw.broadcaster_user_id;
        const item = suspiciousMessage(raw, info, serverTime(e));
        // The chat copy, when Twitch sends one, may come first or just after;
        // flag it so it keeps its badges, else show this event's copy.
        setTimeout(() => {
          if (!setSuspicious(id, item.message_id, info)) appendItem(id, item);
        }, CHAT_COPY_WAIT_MS);
      },
    ),
    listenFeed<RawSuspiciousUserUpdate>(
      "channel.suspicious_user.update",
      (raw, timestamp) =>
        feedEvent(SUSPICIOUS_USER, suspiciousUpdate(raw), timestamp, {
          chatter_name: raw.moderator_user_name,
        }),
    ),
    listenFeed<RawAutomodMessageHold>(
      "automod.message.hold",
      (p, timestamp): FeedMessage => ({
        kind: "message",
        message_id: p.message_id,
        ...chatterFields(p.user_id, p.user_login, p.user_name),
        color: "",
        fragments: p.message.fragments.map(mapFragment),
        badges: [],
        timestamp: new Date(p.held_at).getTime() || timestamp,
        automod_hold: {
          reason: automodReason(p),
          status: "pending",
          broadcaster_user_id: p.broadcaster_user_id,
        },
      }),
    ),
    listenEventSub<RawAutomodMessageUpdate>("automod.message.update", (e) => {
      const p = e.event;
      const status = HOLD_OUTCOMES[p.status.toLowerCase()] ?? "expired";
      setAutomodHoldStatus(
        p.broadcaster_user_id,
        p.message_id,
        status,
        status === "expired" ? undefined : p.moderator_user_name,
      );
    }),
  ]);
}
