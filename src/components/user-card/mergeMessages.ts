import type { FeedMessage } from "../../lib/types/index.ts";

/// Fetched history first, then live messages. History may still belong to
/// the previous chatter after a switch, and overlaps live messages by id.
export function mergeMessages(
  history: FeedMessage[],
  live: FeedMessage[],
  chatterId: string,
): FeedMessage[] {
  const ids = new Set(live.map((m) => m.message_id));
  const older = history.filter((m) =>
    m.chatter_user_id === chatterId && !ids.has(m.message_id)
  );
  return [...older, ...live];
}
