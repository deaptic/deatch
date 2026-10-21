import { t } from "../i18n/index.ts";
import { listenEventSub, serverTime, unlistenAll } from "./listen.ts";
import type {
  AutomodHoldStatus,
  FeedMessage,
  RawAutomodMessageHold,
  RawAutomodMessageUpdate,
  RawChatClear,
  RawChatClearUserMessages,
  RawChatMessageDelete,
  RawModerate,
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
} from "../stores/feeds.ts";
import { feedEvent, withDetail } from "../utils/feedEvent.ts";
import { isModOfChannel, setModeratedChannels } from "../stores/users.ts";
import { events } from "../bindings.ts";
import { mapFragment } from "./chat-mapper.ts";
import { moderateMessage } from "./moderate-message.ts";
import { automodReason } from "./automod-reason.ts";
import {
  moderateNoticeType,
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

export function start(): () => void {
  return unlistenAll([
    events.moderatedChannelsChanged.listen((e) =>
      setModeratedChannels(e.payload)
    ),
    listenEventSub<RawChatMessageDelete>(
      "channel.chat.message_delete",
      (e) => {
        const raw = e.payload.event;
        markMessageDeleted(raw.broadcaster_user_id, raw.message_id);
      },
    ),
    listenEventSub<RawChatClearUserMessages>(
      "channel.chat.clear_user_messages",
      (e) => {
        const raw = e.payload.event;
        markUserMessagesDeleted(raw.broadcaster_user_id, raw.target_user_id);
      },
    ),
    listenEventSub<RawChatClear>("channel.chat.clear", (e) => {
      const broadcasterId = e.payload.event.broadcaster_user_id;
      markAllMessagesDeleted(broadcasterId);
      if (isModOfChannel(broadcasterId)) return;
      const now = serverTime(e.payload);
      appendItem(
        broadcasterId,
        feedEvent(
          "chat_cleared",
          t("EVENT_CHAT_CLEARED"),
          now,
          {
            id: `chat-cleared-${broadcasterId}-${now}`,
          },
        ),
      );
    }),
    listenEventSub<RawModerate>("channel.moderate", (e) => {
      const payload = e.payload.event;
      applySharedChatAction(payload);
      const now = serverTime(e.payload);
      const msg = moderateMessage(payload, now);
      if (!msg) return;
      appendItem(
        payload.broadcaster_user_id,
        feedEvent(moderateNoticeType(payload.action), msg, now, {
          chatter_name: payload.moderator_user_name,
        }),
      );
    }),
    listenEventSub<RawUnbanRequestCreate>(
      "channel.unban_request.create",
      (e) => {
        const raw = e.payload.event;
        appendItem(
          raw.broadcaster_user_id,
          feedEvent(
            UNBAN_REQUEST,
            withDetail(
              t("EVENT_UNBAN_REQUEST", { user: raw.user_name }),
              raw.text,
            ),
            serverTime(e.payload),
            {
              id: `unban-request-${raw.id}`,
              chatter_user_id: raw.user_id,
              chatter_login: raw.user_login,
              chatter_name: raw.user_name,
            },
          ),
        );
      },
    ),
    listenEventSub<RawUnbanRequestResolve>(
      "channel.unban_request.resolve",
      (e) => {
        const raw = e.payload.event;
        // A mod's approve or deny already arrives through channel.moderate.
        if (raw.status !== "canceled") return;
        appendItem(
          raw.broadcaster_user_id,
          feedEvent(
            UNBAN_REQUEST,
            t("EVENT_UNBAN_REQUEST_CANCELED", { user: raw.user_name }),
            serverTime(e.payload),
            {
              chatter_user_id: raw.user_id,
              chatter_login: raw.user_login,
              chatter_name: raw.user_name,
            },
          ),
        );
      },
    ),
    listenEventSub<RawWarningAcknowledge>(
      "channel.warning.acknowledge",
      (e) => {
        const raw = e.payload.event;
        appendItem(
          raw.broadcaster_user_id,
          feedEvent(
            WARNING_ACKNOWLEDGED,
            t("EVENT_WARNING_ACKNOWLEDGED", { user: raw.user_name }),
            serverTime(e.payload),
            {
              chatter_user_id: raw.user_id,
              chatter_login: raw.user_login,
              chatter_name: raw.user_name,
            },
          ),
        );
      },
    ),
    listenEventSub<RawAutomodMessageHold>("automod.message.hold", (e) => {
      const p = e.payload.event;
      const item: FeedMessage = {
        kind: "message",
        message_id: p.message_id,
        chatter_user_id: p.user_id,
        chatter_login: p.user_login,
        chatter_name: p.user_name,
        color: "",
        fragments: p.message.fragments.map(mapFragment),
        badges: [],
        timestamp: new Date(p.held_at).getTime() || serverTime(e.payload),
        automod_hold: {
          reason: automodReason(p),
          status: "pending",
          broadcaster_user_id: p.broadcaster_user_id,
        },
      };
      appendItem(p.broadcaster_user_id, item);
    }),
    listenEventSub<RawAutomodMessageUpdate>(
      "automod.message.update",
      (e) => {
        const p = e.payload.event;
        const s = p.status.toLowerCase();
        const status: AutomodHoldStatus = s.startsWith("appro")
          ? "approved"
          : s.startsWith("den")
          ? "denied"
          : "expired";
        setAutomodHoldStatus(p.broadcaster_user_id, p.message_id, status);
      },
    ),
  ]);
}
