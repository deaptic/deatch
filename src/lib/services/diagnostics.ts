import { unwrap } from "solid-js/store";
import { getAppStats } from "../../platform/diagnostics.ts";
import { feeds } from "../stores/feeds.ts";
import { knownUsers } from "../stores/users.ts";
import type { CacheStats, Diagnostics } from "../types/index.ts";

const POLL_MS = 1000;

export function watch(onSample: (sample: Diagnostics) => void): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    const app = await getAppStats({ silent: true }).catch(() => null);
    if (app && !stopped) {
      onSample({ app, cache: cacheStats(), jsHeapBytes: jsHeapBytes() });
    }
    if (!stopped) timer = setTimeout(tick, POLL_MS);
  };
  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

type ChromiumPerformance = Performance & {
  memory?: { usedJSHeapSize: number };
};

function jsHeapBytes(): number | null {
  return (performance as ChromiumPerformance).memory?.usedJSHeapSize ?? null;
}

function cacheStats(): CacheStats {
  const channelFeeds = Object.values(unwrap(feeds)).filter(
    (feed) => feed !== undefined,
  );
  return {
    users: Object.keys(unwrap(knownUsers)).length,
    channels: channelFeeds.length,
    messages: channelFeeds.reduce((sum, feed) => sum + feed.messages.length, 0),
  };
}
