import type { FeedEntry, FeedMessage, MentionReason } from "../types/index.ts";
import { textOf } from "./message.ts";
import { matchedKeyword } from "./wordMatch.ts";

/// One rule for "this message is for me": an @mention, a reply to me, or a
/// keyword hit. Your own messages never count.
export function mentionReason(
  msg: FeedMessage,
  myLogin: string,
  keywords: string[],
): MentionReason | null {
  const me = myLogin.toLowerCase();
  if (msg.chatter_login.toLowerCase() === me) return null;
  if (msg.reply?.parent_user_login.toLowerCase() === me) {
    return { kind: "reply" };
  }
  if (
    msg.fragments.some(
      (f) => f.type === "mention" && f.user_login.toLowerCase() === me,
    )
  ) {
    return { kind: "mention" };
  }
  const term = matchedKeyword(textOf(msg), keywords);
  return term === null ? null : { kind: "keyword", term };
}

export function isMention(
  msg: FeedMessage,
  myLogin: string,
  keywords: string[],
): boolean {
  return mentionReason(msg, myLogin, keywords) !== null;
}

export function mentionsIn(
  entries: readonly FeedEntry[],
  myLogin: string,
  keywords: string[],
): FeedMessage[] {
  return entries
    .filter(
      (m): m is FeedMessage =>
        m.kind === "message" && isMention(m, myLogin, keywords),
    )
    .reverse();
}
