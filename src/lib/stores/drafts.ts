const drafts = new Map<string, string>();

export function getDraft(channelId: string): string {
  return drafts.get(channelId) ?? "";
}

export function setDraft(channelId: string, text: string) {
  if (text) drafts.set(channelId, text);
  else drafts.delete(channelId);
}
