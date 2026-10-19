// Pure text for channel.moderate notices, kept apart from the listener so it
// can be tested without Tauri.

import type { RawModerate } from "../types/index.ts";
import { formatApproxDuration } from "../format/duration.ts";

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
  const where = p.source_broadcaster_user_name;
  return text && where && p.action.startsWith("shared_chat_")
    ? `In ${where}'s chat, ${text}`
    : text;
}

function localMessage(p: RawModerate, serverNowMs: number): string | null {
  const mod = p.moderator_user_name;
  switch (p.action) {
    case "clear":
      return `${mod} cleared the chat`;
    case "ban": {
      const r = p.ban.reason ? `: ${p.ban.reason}` : "";
      return `${mod} banned ${p.ban.user_name}${r}`;
    }
    case "unban":
      return `${mod} unbanned ${p.unban.user_name}`;
    case "timeout": {
      const secs = Math.max(
        0,
        Math.ceil(
          (new Date(p.timeout.expires_at).getTime() - serverNowMs) / 1000,
        ),
      );
      const r = p.timeout.reason ? `: ${p.timeout.reason}` : "";
      return `${mod} timed out ${p.timeout.user_name} for ${
        formatApproxDuration(secs)
      }${r}`;
    }
    case "untimeout":
      return `${mod} removed timeout on ${p.untimeout.user_name}`;
    case "delete":
      return `${mod} deleted message from ${p.delete.user_name} saying: ${p.delete.message_body}`;
    case "mod":
      return `${mod} added ${p.mod.user_name} as a moderator`;
    case "unmod":
      return `${mod} removed ${p.unmod.user_name} as a moderator`;
    case "vip":
      return `${mod} added ${p.vip.user_name} as a VIP`;
    case "unvip":
      return `${mod} removed ${p.unvip.user_name} as a VIP`;
    case "raid":
      return `${mod} initiated a raid on ${p.raid.user_name}`;
    case "unraid":
      return `${mod} cancelled the raid`;
    case "slow":
      return `${mod} enabled slow mode (${p.slow.wait_time_seconds}s)`;
    case "slowoff":
      return `${mod} disabled slow mode`;
    case "followers":
      return `${mod} enabled followers-only mode (${p.followers.follow_duration_minutes}m)`;
    case "followersoff":
      return `${mod} disabled followers-only mode`;
    case "emoteonly":
      return `${mod} enabled emote-only mode`;
    case "emoteonlyoff":
      return `${mod} disabled emote-only mode`;
    case "subscribers":
      return `${mod} enabled subscribers-only mode`;
    case "subscribersoff":
      return `${mod} disabled subscribers-only mode`;
    case "uniquechat":
      return `${mod} enabled unique-chat mode`;
    case "uniquechatoff":
      return `${mod} disabled unique-chat mode`;
    case "warn": {
      const r = p.warn.reason ? `: ${p.warn.reason}` : "";
      return `${mod} warned ${p.warn.user_name}${r}`;
    }
    default:
      return null;
  }
}
