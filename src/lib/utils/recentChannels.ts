export const RECENT_LIMIT = 10;

export function remember(ids: readonly string[], id: string): string[] {
  return [id, ...ids.filter((other) => other !== id)].slice(0, RECENT_LIMIT);
}
