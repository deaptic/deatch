import { t } from "../../../shared/i18n/index.ts";
import { createTimeouts } from "../../../shared/timeouts.ts";
import {
  listenApp,
  listenEventSub,
  serverTime,
  unlistenAll,
} from "../../../platform/listen.ts";
import { listenFeed } from "./listenFeed.ts";
import type { AutomodHoldStatus, FeedMessage } from "../types.ts";
import type {
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
  RawUserMessageHold,
  RawUserMessageUpdate,
  RawWarningAcknowledge,
} from "../../../platform/twitch/eventsubPayloads.ts";
import {
  appendItem,
  markAllMessagesDeleted,
  markMessageDeleted,
  markUserMessagesDeleted,
  releaseHeldMessage,
  setAutomodHoldStatus,
  setSuspicious,
} from "../store/index.ts";
import { chatterFields, feedEvent, noticeText } from "../entries/feedEvent.ts";
import { setModeratedChannels } from "../../permissions/index.ts";
import { hasPermission } from "../../permissions/index.ts";
import { mapFragment } from "../entries/chat.ts";
import { moderateEvent } from "../entries/moderateMessage.ts";
import { automodReason } from "../entries/automodReason.ts";
import {
  suspiciousInfo,
  suspiciousMessage,
  suspiciousUpdate,
} from "../entries/suspicious.ts";
import {
  CHAT_CLEARED,
  SUSPICIOUS_USER,
  UNBAN_REQUEST,
  WARNING_ACKNOWLEDGED,
} from "../../../shared/moderateActions.ts";

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
    default:
      return;
  }
}

const CHAT_COPY_WAIT_MS = 600;

const HOLD_OUTCOMES: Record<string, AutomodHoldStatus> = {
  approved: "approved",
  denied: "denied",
  expired: "expired",
};

export function start(): () => void {
  const timeouts = createTimeouts();
  const stop = unlistenAll([
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
      if (hasPermission(broadcasterId, "moderate")) return;
      const now = serverTime(e);
      appendItem(
        broadcasterId,
        feedEvent(CHAT_CLEARED, t("FEED_CHAT_CLEARED_LINE"), now, {
          id: `chat-cleared-${broadcasterId}-${now}`,
        }),
      );
    }),
    listenEventSub<RawModerate>("channel.moderate", (e) => {
      const payload = e.event;
      applySharedChatAction(payload);
      const item = moderateEvent(payload, serverTime(e));
      if (item) appendItem(payload.broadcaster_user_id, item);
    }),
    listenFeed<RawUnbanRequestCreate>(
      "channel.unban_request.create",
      (raw, timestamp) =>
        feedEvent(
          UNBAN_REQUEST,
          noticeText(t("FEED_UNBAN_REQUEST_SENT_LINE"), raw.text),
          timestamp,
          {
            id: `unban-request-${raw.id}`,
            unban_request: { id: raw.id },
            ...chatterFields(raw.user_id, raw.user_login, raw.user_name),
          },
        ),
    ),
    listenFeed<RawUnbanRequestResolve>(
      "channel.unban_request.resolve",
      (raw, timestamp) =>
        raw.status === "canceled"
          ? feedEvent(
              UNBAN_REQUEST,
              t("FEED_UNBAN_REQUEST_WITHDRAWN_LINE"),
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
          t("FEED_WARNING_ACKNOWLEDGED_LINE"),
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
        timeouts.after(CHAT_COPY_WAIT_MS, () => {
          if (!setSuspicious(id, item.message_id, info)) appendItem(id, item);
        });
      },
    ),
    listenFeed<RawSuspiciousUserUpdate>(
      "channel.suspicious_user.update",
      (raw, timestamp) =>
        feedEvent(SUSPICIOUS_USER, suspiciousUpdate(raw), timestamp, {
          ...chatterFields(
            raw.moderator_user_id,
            raw.moderator_user_login,
            raw.moderator_user_name,
          ),
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
          mine: false,
        },
      }),
    ),
    listenEventSub<RawUserMessageHold>(
      "channel.chat.user_message_hold",
      (e) => {
        const p = e.event;
        if (hasPermission(p.broadcaster_user_id, "moderate")) return;
        appendItem(p.broadcaster_user_id, {
          kind: "message",
          message_id: p.message_id,
          ...chatterFields(p.user_id, p.user_login, p.user_name),
          color: "",
          fragments: p.message.fragments.map(mapFragment),
          badges: [],
          timestamp: serverTime(e),
          automod_hold: {
            reason: "",
            status: "pending",
            broadcaster_user_id: p.broadcaster_user_id,
            mine: true,
          },
        });
      },
    ),
    listenEventSub<RawUserMessageUpdate>(
      "channel.chat.user_message_update",
      (e) => {
        const p = e.event;
        if (p.status === "approved") {
          releaseHeldMessage(p.broadcaster_user_id, p.message_id);
          return;
        }
        setAutomodHoldStatus(
          p.broadcaster_user_id,
          p.message_id,
          HOLD_OUTCOMES[p.status] ?? "expired",
        );
      },
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
  return () => {
    stop();
    timeouts.clear();
  };
}
