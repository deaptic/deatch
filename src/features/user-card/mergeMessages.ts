import type { FeedMessage } from "../../shared/types/index.ts";

export function mergeMessages(
  history: FeedMessage[],
  live: FeedMessage[],
  chatterId: string,
): FeedMessage[] {
  const ids = new Set(live.map((m) => m.message_id));
  const older = history.filter(
    (m) => m.chatter_user_id === chatterId && !ids.has(m.message_id),
  );
  return [...older, ...live];
}
