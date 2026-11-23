const sent = new Map<string, string[]>();
const SENT_CAP = 50;

export function pushSentMessage(broadcasterId: string, text: string) {
  if (!text) return;
  const arr = sent.get(broadcasterId) ?? [];
  const idx = arr.indexOf(text);
  if (idx >= 0) arr.splice(idx, 1);
  arr.unshift(text);
  if (arr.length > SENT_CAP) arr.pop();
  sent.set(broadcasterId, arr);
}

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
