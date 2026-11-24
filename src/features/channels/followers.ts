import { createEffect, createRoot, createSignal, on } from "solid-js";
import { getFollowerCount } from "../../platform/twitch/followers.ts";
import { listenEventSub, unlistenAll } from "../../platform/listen.ts";
import type { RawFollow } from "../../platform/twitch/eventsubPayloads.ts";
import { selectedChannel } from "../navigation/index.ts";

const [counts, setCounts] = createSignal<Record<string, number>>({});

export function followerCount(broadcasterId: string): number | undefined {
  return counts()[broadcasterId];
}

function set(broadcasterId: string, count: number): void {
  setCounts((prev) => ({ ...prev, [broadcasterId]: count }));
}

function load(broadcasterId: string): void {
  getFollowerCount({ broadcasterId }, { silent: true })
    .then((count) => {
      if (count !== null) set(broadcasterId, count);
    })
    .catch(() => {});
}

function bump(broadcasterId: string): void {
  const count = followerCount(broadcasterId);
  if (count !== undefined) set(broadcasterId, count + 1);
}

export function start(): () => void {
  const stopSelected = createRoot((dispose) => {
    createEffect(
      on(
        () => selectedChannel()?.id,
        (id) => {
          if (id) load(id);
        },
      ),
    );
    return dispose;
  });
  const stopEvents = unlistenAll([
    listenEventSub<RawFollow>("channel.follow", (e) =>
      bump(e.event.broadcaster_user_id),
    ),
  ]);
  return () => {
    stopSelected();
    stopEvents();
    setCounts({});
  };
}
