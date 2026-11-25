import type { FeedEvent, NoticeText, Person } from "../types.ts";
import type {
  RawModerate,
  RawModUser,
} from "../../../platform/twitch/eventsubPayloads.ts";
import { formatApproxDuration } from "../../../shared/format/duration.ts";
import { formatList } from "../../../shared/format/list.ts";
import { t } from "../../../shared/i18n/index.ts";
import { chatterFields, feedEvent, noticeText, person } from "./feedEvent.ts";
import { moderateNoticeType } from "../../../shared/moderateActions.ts";

function asLocal(p: RawModerate): RawModerate {
  switch (p.action) {
    case "shared_chat_ban":
      return { ...p, action: "ban", ban: p.shared_chat_ban };
    case "shared_chat_unban":
      return { ...p, action: "unban", unban: p.shared_chat_unban };
    case "shared_chat_timeout":
      return { ...p, action: "timeout", timeout: p.shared_chat_timeout };
    case "shared_chat_untimeout":
      return { ...p, action: "untimeout", untimeout: p.shared_chat_untimeout };
    case "shared_chat_delete":
      return { ...p, action: "delete", delete: p.shared_chat_delete };
    default:
      return p;
  }
}

function actedOn(p: RawModerate): Person[] {
  const field = p.action.endsWith("_unban_request")
    ? "unban_request"
    : p.action;
  const target = fieldOf(p, field);
  const text = (key: keyof RawModUser) => {
    const value = fieldOf(target, key);
    return typeof value === "string" ? value : undefined;
  };
  return person(text("user_id"), text("user_login"), text("user_name"));
}

function fieldOf(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  return Object.entries(value).find(([name]) => name === key)?.[1];
}

export function moderateMessage(
  p: RawModerate,
  serverNowMs: number,
): NoticeText | null {
  const local = localMessage(asLocal(p), serverNowMs);
  if (!local) return null;
  const notice = typeof local === "string" ? noticeText(local) : local;
  const channel = p.action.startsWith("shared_chat_")
    ? p.source_broadcaster_user_name
    : undefined;
  return {
    ...notice,
    text: channel
      ? t("FEED_SHARED_CHAT_ACTION_LINE", { channel, text: notice.text })
      : notice.text,
    people: [
      ...actedOn(p),
      ...(channel
        ? person(
            p.source_broadcaster_user_id,
            p.source_broadcaster_user_login,
            channel,
          )
        : []),
    ],
  };
}

function localMessage(
  p: RawModerate,
  serverNowMs: number,
): string | NoticeText | null {
  switch (p.action) {
    case "clear":
      return t("FEED_CHAT_CLEARED_BY_LINE");
    case "ban":
      return noticeText(
        t("FEED_BANNED_LINE", { user: p.ban.user_name }),
        p.ban.reason,
      );
    case "unban":
      return t("FEED_UNBANNED_LINE", { user: p.unban.user_name });
    case "timeout": {
      const secs = Math.max(
        0,
        Math.ceil(
          (new Date(p.timeout.expires_at).getTime() - serverNowMs) / 1000,
        ),
      );
      return noticeText(
        t("FEED_TIMED_OUT_LINE", {
          user: p.timeout.user_name,
          duration: formatApproxDuration(secs),
        }),
        p.timeout.reason,
      );
    }
    case "untimeout":
      return t("FEED_TIMEOUT_LIFTED_LINE", {
        user: p.untimeout.user_name,
      });
    case "delete":
      return noticeText(
        t("FEED_MESSAGE_DELETED_LINE", { user: p.delete.user_name }),
        p.delete.message_body,
      );
    case "mod":
      return t("FEED_MOD_ADDED_LINE", { user: p.mod.user_name });
    case "unmod":
      return t("FEED_MOD_REMOVED_LINE", { user: p.unmod.user_name });
    case "vip":
      return t("FEED_VIP_ADDED_LINE", { user: p.vip.user_name });
    case "unvip":
      return t("FEED_VIP_REMOVED_LINE", { user: p.unvip.user_name });
    case "raid":
      return t("FEED_RAID_STARTED_LINE", {
        user: p.raid.user_name,
        count: p.raid.viewer_count,
      });
    case "unraid":
      return t("FEED_RAID_CANCELED_LINE");
    case "slow":
      return t("FEED_SLOW_MODE_ON_LINE", {
        seconds: p.slow.wait_time_seconds,
      });
    case "slowoff":
      return t("FEED_SLOW_MODE_OFF_LINE");
    case "followers":
      return t("FEED_FOLLOWERS_ONLY_ON_LINE", {
        minutes: p.followers.follow_duration_minutes,
      });
    case "followersoff":
      return t("FEED_FOLLOWERS_ONLY_OFF_LINE");
    case "emoteonly":
      return t("FEED_EMOTE_ONLY_ON_LINE");
    case "emoteonlyoff":
      return t("FEED_EMOTE_ONLY_OFF_LINE");
    case "subscribers":
      return t("FEED_SUBSCRIBERS_ONLY_ON_LINE");
    case "subscribersoff":
      return t("FEED_SUBSCRIBERS_ONLY_OFF_LINE");
    case "uniquechat":
      return t("FEED_UNIQUE_CHAT_ON_LINE");
    case "uniquechatoff":
      return t("FEED_UNIQUE_CHAT_OFF_LINE");
    case "warn":
      return noticeText(
        t("FEED_WARNED_LINE", { user: p.warn.user_name }),
        p.warn.reason,
      );
    case "add_blocked_term":
    case "add_permitted_term":
    case "remove_blocked_term":
    case "remove_permitted_term":
      return noticeText(
        t("FEED_AUTOMOD_TERMS_UPDATED_LINE", {
          action: p.automod_terms.action,
          list: p.automod_terms.list,
          count: p.automod_terms.terms.length,
        }),
        formatList(p.automod_terms.terms),
      );
    case "approve_unban_request":
    case "deny_unban_request":
      return noticeText(
        t("FEED_UNBAN_REQUEST_RESOLVED_LINE", {
          approved: String(p.unban_request.is_approved),
          user: p.unban_request.user_name,
        }),
        p.unban_request.moderator_message,
      );
    default:
      return null;
  }
}

export function moderateEvent(
  p: RawModerate,
  serverNowMs: number,
): FeedEvent | null {
  const notice = moderateMessage(p, serverNowMs);
  return (
    notice &&
    feedEvent(
      moderateNoticeType(p.action),
      notice,
      serverNowMs,
      chatterFields(
        p.moderator_user_id,
        p.moderator_user_login,
        p.moderator_user_name,
      ),
    )
  );
}
