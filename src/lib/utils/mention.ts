import type { FeedMessage } from "../types/feed.ts";
import { textOf } from "./message.ts";
import { matchesAnyKeyword } from "./wordMatch.ts";

/// One rule for "this message is for me": an @mention, a reply to me, or a
/// keyword hit. Your own messages never count.
export function isMention(
  msg: FeedMessage,
  myLogin: string,
  keywords: string[],
): boolean {
  const me = myLogin.toLowerCase();
  if (msg.chatter_login.toLowerCase() === me) return false;
  if (msg.reply?.parent_user_login.toLowerCase() === me) return true;
  if (
    msg.fragments.some((f) =>
      f.type === "mention" && f.user_login.toLowerCase() === me
    )
  ) {
    return true;
  }
  return keywords.length > 0 && matchesAnyKeyword(textOf(msg), keywords);
}
