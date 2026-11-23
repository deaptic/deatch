import { createEffect, createRoot, on, onCleanup } from "solid-js";
import {
  getFollowedStreams,
  getStreamsFromIds,
} from "../../platform/twitch/streams.ts";
import { users } from "../users/index.ts";
import * as channelInfo from "./info.ts";
import { user } from "../users/index.ts";
import {
  followedLive,
  setFollowedLive,
  setLiveStreams,
  setPinsLoaded,
} from "./streams.ts";
import { pinnedChannels } from "../preferences/index.ts";
import * as link from "../link/index.ts";
import { selectedChannel } from "../navigation/index.ts";
import type { Stream, User } from "../../shared/types/index.ts";
import { idsNotIn } from "./idsNotIn.ts";

const POLL_MS = 60_000;

const trackedIds = new Set<string>();

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        () => user()?.id,
        (viewerId) => {
          reset();
          if (!viewerId) return;
          void poll(viewerId);
          const timer = setInterval(() => void poll(viewerId), POLL_MS);
          onCleanup(() => clearInterval(timer));
        },
      ),
    );
    createEffect(() => {
      const viewerId = user()?.id;
      if (!viewerId) return;
      users
        .get(pinnedChannels())
        .catch(() => {})
        .finally(() => {
          if (user()?.id === viewerId) setPinsLoaded(true);
        });
    });
    createEffect(() => {
      const viewerId = user()?.id;
      if (!viewerId || followedLive() === null) return;
      const untracked = idsNotIn(trackedIds, wantedIds());
      if (untracked.length > 0) void track(viewerId, untracked);
    });
    return () => {
      dispose();
      reset();
    };
  });
}

function reset() {
  trackedIds.clear();
  setFollowedLive(null);
  setPinsLoaded(false);
  setLiveStreams([]);
}

function wantedIds(): (string | undefined)[] {
  return [
    ...pinnedChannels(),
    ...link.tabs().map((ch) => ch.id),
    link.activeTab()?.id,
    selectedChannel()?.id,
  ];
}

async function poll(viewerId: string) {
  const data = await loadLive(viewerId);
  if (user()?.id !== viewerId) return;
  setFollowedLive((prev) => data ?? prev ?? []);
}

async function loadLive(viewerId: string): Promise<User[] | null> {
  const followed = await getFollowedStreams({ silent: true }).catch(() => null);
  if (!followed) return null;
  const followedIds = new Set(followed.map((s) => s.user.id));
  const extraIds = idsNotIn(followedIds, wantedIds());
  const extraStreams =
    extraIds.length > 0
      ? await getStreamsFromIds({ userIds: extraIds }, { silent: true }).catch(
          () => null,
        )
      : [];
  if (!extraStreams || user()?.id !== viewerId) return null;
  const streams = [...followed, ...extraStreams];

  users.note(streams.map((s) => s.user));
  trackedIds.clear();
  for (const id of [...followedIds, ...extraIds]) trackedIds.add(id);
  setLiveStreams(streams);
  void loadOfflineInfo([...extraIds, viewerId], streams);

  const found =
    streams.length > 0
      ? await users.get(streams.map((s) => s.user.id)).catch(() => null)
      : [];
  if (!found) return null;
  const byId = new Map(found.map((u) => [u.id, u]));
  return followed.flatMap((s) => byId.get(s.user.id) ?? []);
}

async function track(viewerId: string, ids: string[]) {
  for (const id of ids) trackedIds.add(id);
  const streams = await getStreamsFromIds(
    { userIds: ids },
    { silent: true },
  ).catch(() => null);
  if (user()?.id !== viewerId) return;
  if (!streams) {
    for (const id of ids) trackedIds.delete(id);
    return;
  }
  const fetched = new Set(ids);
  setLiveStreams((prev) => [
    ...prev.filter((s) => !fetched.has(s.user.id)),
    ...streams,
  ]);
  await loadOfflineInfo(ids, streams);
}

async function loadOfflineInfo(candidates: string[], streams: Stream[]) {
  const liveIds = new Set(streams.map((s) => s.user.id));
  await channelInfo.load(candidates.filter((id) => !liveIds.has(id)));
}
