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

type Stored = Partial<Mention> & Partial<Legacy>;

/// Current entries pass through; legacy ones are rebuilt into a message;
/// anything older than fragments and reason can't be rendered and is dropped.
function isCurrent(m: Stored): m is Mention {
  return (
    m.message !== undefined &&
    typeof m.id === "string" &&
    typeof m.channelId === "string" &&
    typeof m.channelLogin === "string" &&
    typeof m.channelName === "string" &&
    m.reason !== undefined &&
    typeof m.timestamp === "number" &&
    typeof m.unread === "boolean"
  );
}

export function upgradeMention(m: Stored): Mention | null {
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
    channelId: m.channelId ?? "",
    channelLogin: m.channelLogin ?? "",
    channelName: m.channelName ?? "",
    message,
    reason: m.reason,
    timestamp: m.timestamp,
    unread: m.unread ?? false,
  };
}
