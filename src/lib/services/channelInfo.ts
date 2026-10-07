import { getChannelInformation } from "../api/twitch/channels.ts";
import { rememberChannelInfo } from "../stores/channels.ts";

const FRESH_MS = 10 * 60_000;

const fetchedAt = new Map<string, number>();

export async function load(broadcasterIds: string[]): Promise<void> {
  const now = Date.now();
  const stale = [...new Set(broadcasterIds)].filter((id) =>
    now - (fetchedAt.get(id) ?? 0) >= FRESH_MS
  );
  if (stale.length === 0) return;
  for (const id of stale) fetchedAt.set(id, now);
  try {
    rememberChannelInfo(await getChannelInformation({ broadcasterIds: stale }));
  } catch (e) {
    for (const id of stale) fetchedAt.delete(id);
    console.warn("offline channel info unavailable", stale, e);
  }
}
