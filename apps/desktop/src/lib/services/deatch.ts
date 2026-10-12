import * as api from "../api/deatch.ts";
import { setApiState, setPresenceById } from "../stores/deatch.ts";
import { feeds } from "../stores/feeds.ts";
import { user } from "../stores/users.ts";

const WATCH_INTERVAL_MS = 5_000;

let watched = new Set<string>();

export function connect(): void {
  api.connect({ silent: true }).catch(() => {});
}

export function disconnect(): void {
  watched = new Set();
  setApiState("unknown");
  setPresenceById(new Map());
  api.disconnect({ silent: true }).catch(() => {});
}

export function start(): () => void {
  const id = setInterval(() => {
    if (user()) watchNewChatters();
  }, WATCH_INTERVAL_MS);
  return () => clearInterval(id);
}

function watchNewChatters() {
  const fresh: string[] = [];
  for (const feed of Object.values(feeds)) {
    for (const entry of feed.messages) {
      const id = entry.chatter_user_id;
      if (id && !watched.has(id)) {
        watched.add(id);
        fresh.push(id);
      }
    }
  }
  if (fresh.length > 0) {
    api.watch({ twitchIds: fresh }, { silent: true }).catch(() => {});
  }
}
