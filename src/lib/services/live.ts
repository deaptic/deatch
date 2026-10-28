import { createEffect, createRoot, on, onCleanup } from "solid-js";
import {
  getFollowedStreams,
  getStreamsFromIds,
} from "../api/twitch/streams.ts";
import * as users from "./users.ts";
import * as channelInfo from "./channelInfo.ts";
import { user } from "../stores/users.ts";
import {
  followedLive,
  setFollowedLive,
  setLiveStreams,
  setPinsLoaded,
} from "../stores/channels.ts";
import { pinnedChannels } from "../stores/preferences.ts";
import { linkedChannel, linkWarmedChannels } from "../stores/link.ts";
import { selectedChannel } from "../stores/view.ts";
import type { Stream, User } from "../types/index.ts";
import { idsNotIn } from "../utils/idsNotIn.ts";

const POLL_MS = 60_000;

/// Channels whose live state is known, so each is checked once.
const trackedIds = new Set<string>();

/// While someone is signed in: polls their followed live channels, checks the
/// ones they keep close, and loads the pinned channels' users.
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
      const fresh = idsNotIn(trackedIds, wantedIds());
      if (fresh.length > 0) void track(viewerId, fresh);
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

/// Followed channels plus the ones the user is looking at or keeps close.
function wantedIds(): (string | undefined)[] {
  return [
    ...pinnedChannels(),
    ...linkWarmedChannels().map((ch) => ch.id),
    linkedChannel()?.id,
    selectedChannel()?.id,
  ];
}

/// A failed request keeps the last known list; a blip must not show
/// everyone offline or hold back joining the channels that don't depend on
/// it.
async function poll(viewerId: string) {
  const data = await loadLive(viewerId);
  if (user()?.id !== viewerId) return;
  setFollowedLive((prev) => data ?? prev ?? []);
}

/// Null when a request failed or the viewer changed meanwhile.
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
