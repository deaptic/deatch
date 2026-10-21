// Pure text for channel.moderate notices, kept apart from the listener so it
// can be tested without Tauri.

import type { RawModerate } from "../types/index.ts";
import { formatApproxDuration } from "../format/duration.ts";
import { t } from "../i18n/index.ts";
import { withDetail } from "../utils/feedEvent.ts";

/// A shared chat action reads like the same action taken here.
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

export function moderateMessage(
  p: RawModerate,
  serverNowMs: number,
): string | null {
  const text = localMessage(asLocal(p), serverNowMs);
  const channel = p.source_broadcaster_user_name;
  return text && channel && p.action.startsWith("shared_chat_")
    ? t("MODERATION_SHARED", { channel, text })
    : text;
}

function localMessage(p: RawModerate, serverNowMs: number): string | null {
  const mod = p.moderator_user_name;
  switch (p.action) {
    case "clear":
      return t("MODERATION_CLEAR", { mod });
    case "ban":
      return withDetail(
        t("MODERATION_BAN", { mod, user: p.ban.user_name }),
        p.ban.reason,
      );
    case "unban":
      return t("MODERATION_UNBAN", { mod, user: p.unban.user_name });
    case "timeout": {
      const secs = Math.max(
        0,
        Math.ceil(
          (new Date(p.timeout.expires_at).getTime() - serverNowMs) / 1000,
        ),
      );
      return withDetail(
        t("MODERATION_TIMEOUT", {
          mod,
          user: p.timeout.user_name,
          duration: formatApproxDuration(secs),
        }),
        p.timeout.reason,
      );
    }
    case "untimeout":
      return t("MODERATION_UNTIMEOUT", { mod, user: p.untimeout.user_name });
    case "delete":
      return t("MODERATION_DELETE", {
        mod,
        user: p.delete.user_name,
        message: p.delete.message_body,
      });
    case "mod":
      return t("MODERATION_MOD", { mod, user: p.mod.user_name });
    case "unmod":
      return t("MODERATION_UNMOD", { mod, user: p.unmod.user_name });
    case "vip":
      return t("MODERATION_VIP", { mod, user: p.vip.user_name });
    case "unvip":
      return t("MODERATION_UNVIP", { mod, user: p.unvip.user_name });
    case "raid":
      return t("MODERATION_RAID", {
        mod,
        user: p.raid.user_name,
        count: p.raid.viewer_count,
      });
    case "unraid":
      return t("MODERATION_UNRAID", { mod });
    case "slow":
      return t("MODERATION_SLOW", {
        mod,
        seconds: p.slow.wait_time_seconds,
      });
    case "slowoff":
      return t("MODERATION_SLOW_OFF", { mod });
    case "followers":
      return t("MODERATION_FOLLOWERS", {
        mod,
        minutes: p.followers.follow_duration_minutes,
      });
    case "followersoff":
      return t("MODERATION_FOLLOWERS_OFF", { mod });
    case "emoteonly":
      return t("MODERATION_EMOTE_ONLY", { mod });
    case "emoteonlyoff":
      return t("MODERATION_EMOTE_ONLY_OFF", { mod });
    case "subscribers":
      return t("MODERATION_SUBSCRIBERS", { mod });
    case "subscribersoff":
      return t("MODERATION_SUBSCRIBERS_OFF", { mod });
    case "uniquechat":
      return t("MODERATION_UNIQUE_CHAT", { mod });
    case "uniquechatoff":
      return t("MODERATION_UNIQUE_CHAT_OFF", { mod });
    case "warn":
      return withDetail(
        t("MODERATION_WARN", { mod, user: p.warn.user_name }),
        p.warn.reason,
      );
    case "add_blocked_term":
    case "add_permitted_term":
    case "remove_blocked_term":
    case "remove_permitted_term":
      return t("MODERATION_AUTOMOD_TERMS", {
        mod,
        action: p.automod_terms.action,
        list: p.automod_terms.list,
        count: p.automod_terms.terms.length,
        terms: p.automod_terms.terms.join(", "),
      });
    case "approve_unban_request":
    case "deny_unban_request":
      return withDetail(
        t("MODERATION_UNBAN_REQUEST", {
          mod,
          approved: String(p.unban_request.is_approved),
          user: p.unban_request.user_name,
        }),
        p.unban_request.moderator_message,
      );
    default:
      return null;
  }
}
