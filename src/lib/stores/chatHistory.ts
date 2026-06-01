const sentHistory = new Map<string, string[]>();
const HISTORY_CAP = 50;

/// Pushes a freshly-sent message to the front (newest) of the channel's
/// history. If the text already exists elsewhere in the list, it is moved
/// to the front rather than duplicated.
export function pushSentHistory(id: string, text: string) {
  if (!text) return;
  const arr = sentHistory.get(id) ?? [];
  const idx = arr.indexOf(text);
  if (idx >= 0) arr.splice(idx, 1);
  arr.unshift(text);
  if (arr.length > HISTORY_CAP) arr.pop();
  sentHistory.set(id, arr);
}

/// Appends a historical (older) message to the back of the channel's
/// history — used for backlog hydration, where messages predate anything
/// already captured live. Skips duplicates and respects the cap.
export function appendSentHistoryOlder(id: string, text: string) {
  if (!text) return;
  const arr = sentHistory.get(id) ?? [];
  if (arr.includes(text)) return;
  if (arr.length >= HISTORY_CAP) return;
  arr.push(text);
  sentHistory.set(id, arr);
}

export function getSentHistory(id: string): string[] | undefined {
  return sentHistory.get(id);
}
