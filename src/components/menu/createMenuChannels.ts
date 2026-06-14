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
  getStreams,
  type Stream,
} from "../../lib/api/twitch/streams.ts";
import { getUsers } from "../../lib/api/twitch/users.ts";
import { fetchAllPages } from "../../lib/api/utils.ts";
import { addToast } from "../../lib/stores/toasts.ts";
import { rememberUser, setLiveStreams } from "../../lib/stores/channels.ts";
import { menuChannelPinned } from "../../lib/stores/preferences.ts";
import { watchedChannel, watchWarmedChannels } from "../../lib/stores/watch.ts";
import { selectedChannel } from "../../lib/stores/view.ts";
import type { User } from "../../lib/types/twitch/user.ts";

export type MenuChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
  cachePinned: (u: User) => void;
};

export function createMenuChannels(
  onLiveChange?: (live: User[]) => void,
): MenuChannels {
  const [live, setLive] = createStore<User[]>([]);
  const [pinnedMeta, setPinnedMeta] = createStore<Record<string, User>>({});
  const [loadingPinned, setLoadingPinned] = createSignal(true);
  const [loadingLive, setLoadingLive] = createSignal(true);

  const liveById = createMemo(() => new Map(live.map((ch) => [ch?.id, ch])));
  const pinnedIdSet = createMemo(() => new Set(menuChannelPinned()));
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
    const ids = menuChannelPinned();
    if (ids.length === 0) {
      setLoadingPinned(false);
      return;
    }
    try {
      const users = await getUsers({ ids });
      const next: Record<string, User> = {};
      for (const u of users) {
        next[u.id] = u;
        rememberUser(u);
      }
      setPinnedMeta(reconcile(next));
    } catch (e) {
      addToast(String(e), "error");
    } finally {
      setLoadingPinned(false);
    }
  }

  async function fetchLive() {
    try {
      const followed = await fetchAllPages<Stream>(
        "get_followed_streams",
        (after, opts) => getFollowedStreams({ after }, opts),
      );
      const followedIds = new Set(followed.map((s) => s.user.id));
      const pinnedSet = new Set(menuChannelPinned());
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
        ? await fetchAllPages<Stream>(
          "get_streams",
          (after, opts) => getStreams({ userIds: extraIdList, after }, opts),
        )
        : [];
      const streams = [...followed, ...extraStreams];

      setLiveStreams(streams);
      const data: User[] = [];
      if (streams.length > 0) {
        const users = await getUsers({ ids: streams.map((s) => s.user.id) });
        const byId = new Map(users.map((u) => [u.id, u]));
        for (const u of users) rememberUser(u);
        for (const s of followed) {
          const u = byId.get(s.user.id);
          if (u) data.push(u);
        }
      }
      setLive(reconcile(data, { key: "id" }));
      onLiveChange?.(data);
    } catch (e) {
      addToast(String(e), "error");
      setLiveStreams([]);
      onLiveChange?.([]);
    } finally {
      setLoadingLive(false);
    }
  }

  createEffect(() => {
    const missing = menuChannelPinned().filter(
      (id) => !pinnedMeta[id] && !liveById().get(id),
    );
    if (missing.length === 0) return;
    getUsers({ ids: missing })
      .then((users) => {
        const updates: Record<string, User> = {};
        for (const u of users) {
          updates[u.id] = u;
          rememberUser(u);
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

  createEffect(on(watchedChannel, () => fetchLive(), { defer: true }));
  createEffect(on(selectedChannel, () => fetchLive(), { defer: true }));

  return {
    loadingPinned,
    loadingLive,
    onlineList,
    resolveChannel,
    isLive,
    cachePinned: (u) => setPinnedMeta(u.id, u),
  };
}
