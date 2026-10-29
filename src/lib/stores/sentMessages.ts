const sent = new Map<string, string[]>();
const SENT_CAP = 50;

/// Pushes a freshly-sent message to the front (newest) of the channel's
/// sent messages. If the text already exists elsewhere in the list, it is
/// moved to the front rather than duplicated.
export function pushSentMessage(broadcasterId: string, text: string) {
  if (!text) return;
  const arr = sent.get(broadcasterId) ?? [];
  const idx = arr.indexOf(text);
  if (idx >= 0) arr.splice(idx, 1);
  arr.unshift(text);
  if (arr.length > SENT_CAP) arr.pop();
  sent.set(broadcasterId, arr);
}

/// Appends an older message to the back of the channel's sent messages —
/// used for backlog hydration, where messages predate anything already
/// captured live. Skips duplicates and respects the cap.
export function appendOlderSentMessage(broadcasterId: string, text: string) {
  if (!text) return;
  const arr = sent.get(broadcasterId) ?? [];
  if (arr.includes(text)) return;
  if (arr.length >= SENT_CAP) return;
  arr.push(text);
  sent.set(broadcasterId, arr);
}

export function sentMessages(broadcasterId: string): string[] | undefined {
  return sent.get(broadcasterId);
}

export function clearSentMessages(broadcasterId: string) {
  sent.delete(broadcasterId);
}
