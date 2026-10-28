import type { Chatter } from "../types/index.ts";
import { rankSuggestions } from "./rankSuggestions.ts";

const LIMIT = 10;

/// Chatters matching `query` by login or display name, most recent first.
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
