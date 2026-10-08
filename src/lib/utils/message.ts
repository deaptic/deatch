import type { FeedMessage, Fragment } from "../types/feed.ts";

export function textOf(msg: Pick<FeedMessage, "fragments">): string {
  return msg.fragments.map((f) => f.text).join("");
}

/// Twitch prefixes a reply with "@parent ", which is noise next to the
/// reply line the UI already shows.
export function withoutReplyMention(msg: FeedMessage): Fragment[] {
  const [first, ...rest] = msg.fragments;
  if (
    !msg.reply ||
    first?.type !== "mention" ||
    first.user_login !== msg.reply.parent_user_login
  ) {
    return msg.fragments;
  }
  if (rest[0]?.type === "text") {
    const trimmed = rest[0].text.trimStart();
    return trimmed
      ? [{ ...rest[0], text: trimmed }, ...rest.slice(1)]
      : rest.slice(1);
  }
  return rest;
}
