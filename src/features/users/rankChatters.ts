import type { Chatter } from "../../lib/types/index.ts";
import { rankSuggestions } from "../../lib/utils/rankSuggestions.ts";

const LIMIT = 10;

export function rankChatters(
  chatters: Iterable<Chatter>,
  query: string,
): Chatter[] {
  return rankSuggestions(chatters, query, {
    keys: (c) => [c.login.toLowerCase(), c.displayName.toLowerCase()],
    compare: (a, b) => b.lastSeen - a.lastSeen,
    limit: LIMIT,
  });
}
