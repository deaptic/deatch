const drafts = new Map<string, string>();

export function getDraft(broadcasterId: string): string {
  return drafts.get(broadcasterId) ?? "";
}

export function setDraft(broadcasterId: string, text: string) {
  if (text) drafts.set(broadcasterId, text);
  else drafts.delete(broadcasterId);
}
