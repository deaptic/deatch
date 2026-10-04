import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import {
  getFollowedStreams,
  getStreamsFromIds,
} from "../../lib/api/twitch/streams.ts";
import * as users from "../../lib/services/users.ts";
import { getChannelInformation } from "../../lib/api/twitch/channels.ts";
import { user } from "../../lib/stores/users.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import {
  rememberChannelInfo,
  setLiveStreams,
  userFromRef,
} from "../../lib/stores/channels.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import { watchedChannel, watchWarmedChannels } from "../../lib/stores/watch.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import type { Stream, User } from "../../lib/types/index.ts";

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

  const liveById = createMemo(() => new Map(live.map((ch) => [ch?.id, ch])));
  const pinnedIdSet = createMemo(() => new Set(pinnedChannels()));
  const warmedIdSet = createMemo(
    () => new Set(watchWarmedChannels().map((ch) => ch?.id)),
  );
  const onlineList = createMemo(() =>
    live.filter((ch) =>
      !pinnedIdSet().has(ch?.id) && !warmedIdSet().has(ch?.id)
    )
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
    if (ids.length === 0) return;
    try {
      rememberChannelInfo(
        await getChannelInformation({ broadcasterIds: [...new Set(ids)] }),
      );
    } catch {
      // Offline metadata is decorative; the rail works without it.
    }
  }

  async function fetchLive() {
    try {
      const followed = await getFollowedStreams();
      const followedIds = new Set(followed.map((s) => s.user.id));
      const pinnedSet = new Set(pinnedChannels());
      const extraIds = new Set<string>();
      for (const id of pinnedSet) if (!followedIds.has(id)) extraIds.add(id);
      const wc = watchedChannel();
      if (wc && !followedIds.has(wc?.id) && !pinnedSet.has(wc?.id)) {
        extraIds.add(wc?.id);
      }
      for (const ch of watchWarmedChannels()) {
        if (!followedIds.has(ch?.id) && !pinnedSet.has(ch?.id)) {
          extraIds.add(ch?.id);
        }
      }
      const sel = selectedChannel();
      if (sel && !followedIds.has(sel.id) && !pinnedSet.has(sel.id)) {
        extraIds.add(sel.id);
      }
      const extraIdList = [...extraIds];
      const extraStreams = extraIdList.length > 0
        ? await getStreamsFromIds({ userIds: extraIdList })
        : [];
      const streams = [...followed, ...extraStreams];

      users.set(streams.map((s) => userFromRef(s.user)));
      trackedIds.clear();
      for (const id of [...followedIds, ...extraIdList]) trackedIds.add(id);
      setLiveStreams(streams);
      const self = user();
      void loadOfflineInfo(
        self ? [...extraIdList, self.id] : extraIdList,
        streams,
      );
      const data: User[] = [];
      if (streams.length > 0) {
        const found = await users.get(streams.map((s) => s.user.id));
        const byId = new Map(found.map((u) => [u.id, u]));
        for (const s of followed) {
          const u = byId.get(s.user.id);
          if (u) data.push(u);
        }
      }
      setLive(reconcile(data, { key: "id" }));
      onLiveChange?.(data);
    } catch (e) {
      addToast(errorMessage(e), "error");
      setLiveStreams([]);
      onLiveChange?.([]);
    } finally {
      setLoadingLive(false);
    }
  }

  createEffect(() => {
    const missing = pinnedChannels().filter(
      (id) => !pinnedMeta[id] && !liveById().get(id),
    );
    if (missing.length === 0) return;
    users.get(missing)
      .then((users) => {
        const updates: Record<string, User> = {};
        for (const u of users) {
          updates[u.id] = u;
        }
        setPinnedMeta(updates);
      })
      .catch(() => {});
  });

  onMount(() => {
    fetchPinnedMeta();
    fetchLive();
    const id = setInterval(fetchLive, 60_000);
    onCleanup(() => clearInterval(id));
  });

  async function track(id: string) {
    if (trackedIds.has(id)) return;
    trackedIds.add(id);
    try {
      const streams = await getStreamsFromIds({ userIds: [id] });
      if (streams.length > 0) {
        setLiveStreams((prev) => [
          ...prev.filter((s) => s.user.id !== id),
          ...streams,
        ]);
      }
      await loadOfflineInfo([id], streams);
    } catch {
      trackedIds.delete(id);
    }
  }

  createEffect(on(watchedChannel, (ch) => ch && track(ch.id), { defer: true }));
  createEffect(
    on(selectedChannel, (ch) => ch && track(ch.id), { defer: true }),
  );

  return {
    loadingPinned,
    loadingLive,
    onlineList,
    resolveChannel,
    isLive,
    cachePinned: (u) => setPinnedMeta(u.id, u),
  };
}
