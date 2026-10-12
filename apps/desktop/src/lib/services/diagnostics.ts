import { unwrap } from "solid-js/store";
import { getAppStats } from "../api/diagnostics.ts";
import { feeds } from "../stores/feeds.ts";
import { knownUsers } from "../stores/users.ts";
import type { CacheStats, Diagnostics } from "../types/diagnostics.ts";

const POLL_MS = 1000;

/// Polls only while watched, and waits for each sample before scheduling the
/// next so slow samples never pile up.
export function watch(onSample: (sample: Diagnostics) => void): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    try {
      const app = await getAppStats();
      if (!stopped) onSample({ app, cache: cacheStats() });
    } catch (e) {
      console.warn("diagnostics unavailable", e);
    }
    if (!stopped) timer = setTimeout(tick, POLL_MS);
  };
  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

function cacheStats(): CacheStats {
  const channelFeeds = Object.values(unwrap(feeds));
  return {
    users: Object.keys(unwrap(knownUsers)).length,
    channels: channelFeeds.length,
    messages: channelFeeds.reduce(
      (sum, feed) => sum + feed.messages.length,
      0,
    ),
  };
}
