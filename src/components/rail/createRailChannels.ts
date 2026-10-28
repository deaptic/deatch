import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import {
  getFollowedStreams,
  getStreamsFromIds,
} from "../../lib/api/twitch/streams.ts";
import * as users from "../../lib/services/users.ts";
import * as channelInfo from "../../lib/services/channelInfo.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import { setLiveStreams, userFromRef } from "../../lib/stores/channels.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import { linkedChannel, linkWarmedChannels } from "../../lib/stores/link.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import type { Stream, User } from "../../lib/types/index.ts";
import { idsNotIn } from "./idsNotIn.ts";

export type RailChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
  cachePinned: (u: User) => void;
};

export function createRailChannels(
  onLiveChange?: (live: User[]) => void,
): RailChannels {
  const [live, setLive] = createStore<User[]>([]);
  const [pinnedMeta, setPinnedMeta] = createStore<Record<string, User>>({});
  const [loadingPinned, setLoadingPinned] = createSignal(true);
  const [loadingLive, setLoadingLive] = createSignal(true);

  const liveById = createMemo(() => new Map(live.map((ch) => [ch.id, ch])));
  const pinnedIdSet = createMemo(() => new Set(pinnedChannels()));
  const warmedIdSet = createMemo(
    () => new Set(linkWarmedChannels().map((ch) => ch.id)),
  );
  const onlineList = createMemo(() =>
    live.filter((ch) => !pinnedIdSet().has(ch.id) && !warmedIdSet().has(ch.id)),
  );
  const resolveChannel = (id: string): User | undefined =>
    liveById().get(id) ?? pinnedMeta[id];
  const isLive = (id: string) => liveById().has(id);

  async function fetchPinnedMeta() {
    const ids = pinnedChannels();
    if (ids.length === 0) {
      setLoadingPinned(false);
      return;
    }
    try {
      const found = await users.get(ids);
      const next: Record<string, User> = {};
      for (const u of found) {
        next[u.id] = u;
      }
      setPinnedMeta(reconcile(next));
    } catch (e) {
      addToast(errorMessage(e), "error");
    } finally {
      setLoadingPinned(false);
    }
  }

  const trackedIds = new Set<string>();

  async function loadOfflineInfo(candidates: string[], streams: Stream[]) {
    const liveIds = new Set(streams.map((s) => s.user.id));
    const ids = candidates.filter((id) => !liveIds.has(id));
    await channelInfo.load(ids);
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
  async function fetchLive() {
    try {
      onLiveChange?.((await loadLive()) ?? [...live]);
    } finally {
      setLoadingLive(false);
    }
  }

  /// Null when a request failed.
  async function loadLive(): Promise<User[] | null> {
    const followed = await getFollowedStreams({ silent: true }).catch(
      () => null,
    );
    if (!followed) return null;
    const followedIds = new Set(followed.map((s) => s.user.id));
    const extraIds = idsNotIn(followedIds, wantedIds());
    const extraStreams =
      extraIds.length > 0
        ? await getStreamsFromIds(
            { userIds: extraIds },
            { silent: true },
          ).catch(() => null)
        : [];
    if (!extraStreams) return null;
    const streams = [...followed, ...extraStreams];

    users.set(streams.map((s) => userFromRef(s.user)));
    trackedIds.clear();
    for (const id of [...followedIds, ...extraIds]) trackedIds.add(id);
    setLiveStreams(streams);
    const self = user();
    void loadOfflineInfo(self ? [...extraIds, self.id] : extraIds, streams);

    const found =
      streams.length > 0
        ? await users.get(streams.map((s) => s.user.id)).catch(() => null)
        : [];
    if (!found) return null;
    const byId = new Map(found.map((u) => [u.id, u]));
    const data = followed.flatMap((s) => byId.get(s.user.id) ?? []);
    setLive(reconcile(data, { key: "id" }));
    return data;
  }

  createEffect(() => {
    const missing = pinnedChannels().filter(
      (id) => !pinnedMeta[id] && !liveById().get(id),
    );
    if (missing.length === 0) return;
    users.get(missing).then(
      (users) => {
        const updates: Record<string, User> = {};
        for (const u of users) {
          updates[u.id] = u;
        }
        setPinnedMeta(updates);
      },
      () => {},
    );
  });

  onMount(() => {
    void fetchPinnedMeta();
    void fetchLive();
    const id = setInterval(fetchLive, 60_000);
    onCleanup(() => clearInterval(id));
  });

  async function track(ids: string[]) {
    for (const id of ids) trackedIds.add(id);
    const streams = await getStreamsFromIds(
      { userIds: ids },
      { silent: true },
    ).catch(() => null);
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

  createEffect(() => {
    if (loadingLive()) return;
    const fresh = idsNotIn(trackedIds, wantedIds());
    if (fresh.length > 0) void track(fresh);
  });

  return {
    loadingPinned,
    loadingLive,
    onlineList,
    resolveChannel,
    isLive,
    cachePinned: (u) => setPinnedMeta(u.id, u),
  };
}
