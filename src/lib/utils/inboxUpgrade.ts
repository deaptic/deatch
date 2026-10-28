import type { FeedMessage, Fragment, Mention } from "../types/index.ts";

/// Mentions saved before they kept the whole message.
type Legacy = {
  messageId: string;
  chatterId: string;
  chatterLogin: string;
  chatterName: string;
  chatterColor: string;
  fragments: Fragment[];
};

/// Mentions saved before the channel fields were named for the broadcaster.
type ChannelNamed = {
  channelId: string;
  channelLogin: string;
  channelName: string;
};

type Stored = Partial<Mention> & Partial<Legacy> & Partial<ChannelNamed>;

/// Current entries pass through; legacy ones are rebuilt into a message;
/// anything older than fragments and reason can't be rendered and is dropped.
function isCurrent(m: Stored): m is Mention {
  return (
    m.message !== undefined &&
    typeof m.id === "string" &&
    typeof m.broadcasterId === "string" &&
    typeof m.broadcasterLogin === "string" &&
    typeof m.broadcasterName === "string" &&
    m.reason !== undefined &&
    typeof m.timestamp === "number" &&
    typeof m.unread === "boolean"
  );
}

function renameChannelFields(stored: Stored): Stored {
  const { channelId, channelLogin, channelName, ...m } = stored;
  return {
    ...m,
    broadcasterId: m.broadcasterId ?? channelId,
    broadcasterLogin: m.broadcasterLogin ?? channelLogin,
    broadcasterName: m.broadcasterName ?? channelName,
  };
}

export function upgradeMention(stored: Stored): Mention | null {
  const m = renameChannelFields(stored);
  if (m.message) return isCurrent(m) ? m : null;
  if (!Array.isArray(m.fragments) || !m.reason || m.timestamp === undefined) {
    return null;
  }
  const message: FeedMessage = {
    kind: "message",
    message_id: m.messageId ?? m.id ?? "",
    chatter_user_id: m.chatterId ?? "",
    chatter_login: m.chatterLogin ?? "",
    chatter_name: m.chatterName ?? "",
    color: m.chatterColor ?? "",
    fragments: m.fragments,
    badges: [],
    timestamp: m.timestamp,
  };
  return {
    id: m.id ?? message.message_id,
    broadcasterId: m.broadcasterId ?? "",
    broadcasterLogin: m.broadcasterLogin ?? "",
    broadcasterName: m.broadcasterName ?? "",
    message,
    reason: m.reason,
    timestamp: m.timestamp,
    unread: m.unread ?? false,
  };
}
