import {
  Show,
  For,
  createSignal,
  createEffect,
  on,
  onMount,
  onCleanup,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getFollowedStreams, getStreams, type Stream } from "../../commands/twitch/streams";
import { getUsers, type User } from "../../commands/twitch/users";
import { fetchAllPages } from "../../commands/utils";
import { addToast } from "../../state/toasts";
import {
  rememberChannel,
  setLiveChannels,
  selectedChannel,
} from "../../state/channels";
import {
  advancedDeveloperMode,
  menuChannelPinned,
  pinChannel,
  unpinChannel,
  reorderPinnedChannels,
} from "../../state/preferences";
import { hasUnread } from "../../state/feeds";
import { channelMentionCount } from "../../state/inbox";
import {
  watchActive,
  watchConnected,
  watchedChannel,
  watchWarmedChannels,
  setWatchActive,
} from "../../state/watch";
import MenuSection from "./MenuSection";
import MenuSectionItem from "./MenuSectionItem";
import MenuAddButton from "./MenuAddButton";
import InputPopover from "../../ui/InputPopover";
import ChannelContextMenu from "../context-menus/ChannelContextMenu";
import type { Channel } from "../../types/composed";

export type { Channel };

type Props = {
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onLiveChange?: (live: Channel[]) => void;
};

function userToChannel(u: User): Channel {
  return {
    user_id: u.id,
    user_login: u.login,
    user_name: u.displayName,
    profile_image_url: u.profileImageUrl,
  };
}

export default function Menu(props: Props) {
  const [live, setLive] = createStore<Channel[]>([]);
  const [pinnedMeta, setPinnedMeta] = createStore<Record<string, Channel>>({});
  const [loadingPinned, setLoadingPinned] = createSignal(true);
  const [loadingLive, setLoadingLive] = createSignal(true);

  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);

  const [chMenu, setChMenu] = createSignal<{
    ch: Channel;
    x: number;
    y: number;
  } | null>(null);

  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  let addBtn: HTMLButtonElement | undefined;

  const liveById = () => new Map(live.map((ch) => [ch.user_id, ch]));
  const pinnedIdSet = () => new Set(menuChannelPinned());
  const onlineList = () => live.filter((ch) => !pinnedIdSet().has(ch.user_id));
  const resolveChannel = (id: string): Channel | undefined =>
    liveById().get(id) ?? pinnedMeta[id];

  async function fetchPinnedMeta() {
    const ids = menuChannelPinned();
    if (ids.length === 0) {
      setLoadingPinned(false);
      return;
    }
    try {
      const users = await getUsers({ ids });
      const next: Record<string, Channel> = {};
      for (const u of users) {
        const ch = userToChannel(u);
        next[u.id] = ch;
        rememberChannel(ch);
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
      if (wc && !followedIds.has(wc.user_id) && !pinnedSet.has(wc.user_id)) {
        extraIds.add(wc.user_id);
      }
      for (const ch of watchWarmedChannels()) {
        if (!followedIds.has(ch.user_id) && !pinnedSet.has(ch.user_id)) {
          extraIds.add(ch.user_id);
        }
      }
      const extraIdList = [...extraIds];
      const extraStreams =
        extraIdList.length > 0
          ? await fetchAllPages<Stream>("get_streams", (after, opts) =>
              getStreams({ userIds: extraIdList, after }, opts),
            )
          : [];
      const streams = [...followed, ...extraStreams];

      const profileMap = new Map<string, string>();
      if (streams.length > 0) {
        const users = await getUsers({
          ids: streams.map((s) => s.user.id),
        });
        for (const u of users) profileMap.set(u.id, u.profileImageUrl);
      }
      const data: Channel[] = streams.map((s) => ({
        user_id: s.user.id,
        user_login: s.user.login,
        user_name: s.user.displayName,
        game_name: s.game.name,
        title: s.title,
        viewer_count: s.viewerCount,
        thumbnail_url: s.thumbnail.medium,
        profile_image_url: profileMap.get(s.user.id) ?? "",
        started_at: s.startedAt,
      }));
      for (const ch of data) rememberChannel(ch);
      setLive(reconcile(data, { key: "user_id" }));
      setLiveChannels(data);
      props.onLiveChange?.(data);
    } catch (e) {
      addToast(String(e), "error");
      // Signal the parent that the fetch settled (even unsuccessfully) so it
      // can stop waiting on us before proceeding with subscriptions.
      setLiveChannels([]);
      props.onLiveChange?.([]);
    } finally {
      setLoadingLive(false);
    }
  }

  // Fetch metadata for any newly-pinned channels we don't yet have data for.
  createEffect(() => {
    const missing = menuChannelPinned().filter(
      (id) => !pinnedMeta[id] && !liveById().get(id),
    );
    if (missing.length === 0) return;
    getUsers({ ids: missing })
      .then((users) => {
        const updates: Record<string, Channel> = {};
        for (const u of users) {
          const ch = userToChannel(u);
          updates[u.id] = ch;
          rememberChannel(ch);
        }
        setPinnedMeta(updates);
      })
      .catch(() => {});
  });

  function startDrag(e: MouseEvent, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragIdx(idx);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-pinned-index]") as HTMLElement | null;
      const i = row ? parseInt(row.dataset.pinnedIndex!) : null;
      setOverIdx(i !== null && !isNaN(i) ? i : null);
    };
    const onUp = () => {
      const over = overIdx();
      if (over !== null && over !== idx) reorderPinnedChannels(idx, over);
      setDragIdx(null);
      setOverIdx(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function openInBrowser(ch: Channel) {
    openUrl(`https://twitch.tv/${ch.user_login}`);
  }

  function openAdd() {
    if (!addBtn) return;
    const rect = addBtn.getBoundingClientRect();
    setAddInput("");
    setAddPop({ x: rect.right + 8, y: rect.top });
  }

  function closeAdd() {
    setAddPop(null);
    setAddInput("");
  }

  async function submitAdd() {
    const login = addInput().trim().toLowerCase();
    if (!login) return;
    setAddLoading(true);
    try {
      const users = await getUsers({ logins: [login] });
      const u = users[0];
      if (!u) throw new Error("User not found");
      if (menuChannelPinned().includes(u.id)) {
        addToast("Already pinned", "error");
        closeAdd();
        return;
      }
      const ch = userToChannel(u);
      setPinnedMeta(u.id, ch);
      rememberChannel(ch);
      pinChannel(u.id);
      closeAdd();
    } catch (e) {
      addToast(String(e), "error");
    } finally {
      setAddLoading(false);
    }
  }

  onMount(() => {
    fetchPinnedMeta();
    fetchLive();
    const id = setInterval(fetchLive, 60_000);
    onCleanup(() => clearInterval(id));
  });

  // Refresh live data immediately on watched-channel change instead of
  // waiting for the next 60s tick.
  createEffect(on(watchedChannel, () => fetchLive(), { defer: true }));

  return (
    <div class="flex flex-col h-full w-14 shrink-0 bg-bg-dark border-r border-border-muted overflow-hidden">
      <div class="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MenuSection divider="bottom">
          <Show
            when={!loadingPinned()}
            fallback={
              <For each={menuChannelPinned()}>
                {() => (
                  <div class="w-full flex items-center justify-center p-2">
                    <div class="w-8 h-8 rounded-lg bg-bg-light animate-pulse" />
                  </div>
                )}
              </For>
            }
          >
            <For each={menuChannelPinned()}>
              {(id, index) => {
                const ch = () => resolveChannel(id);
                const isOver = () =>
                  overIdx() === index() && dragIdx() !== index();
                return (
                  <Show when={ch()}>
                    {(c) => (
                      <div
                        data-pinned-index={index()}
                        class="relative"
                        onMouseDown={(e) => startDrag(e, index())}
                      >
                        <Show when={isOver()}>
                          <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-primary rounded-full z-10" />
                        </Show>
                        <MenuSectionItem
                          channel={c()}
                          status={liveById().has(id) ? "live" : undefined}
                          selected={!watchActive() && props.selectedId === id}
                          unread={hasUnread(id)}
                          mentions={channelMentionCount(id)}
                          dimmed={dragIdx() === index()}
                          onClick={() => props.onSelect(c())}
                          onMiddleClick={() => openInBrowser(c())}
                          onContextMenu={(x, y) => setChMenu({ ch: c(), x, y })}
                        />
                      </div>
                    )}
                  </Show>
                );
              }}
            </For>
          </Show>
          <MenuAddButton ref={(el) => (addBtn = el)} onClick={openAdd} />
        </MenuSection>

        <MenuSection>
          <Show
            when={!loadingLive()}
            fallback={
              <>
                {Array.from({ length: 4 }).map(() => (
                  <div class="w-full flex items-center justify-center p-2">
                    <div class="w-8 h-8 rounded-lg bg-bg-light animate-pulse" />
                  </div>
                ))}
              </>
            }
          >
            <For each={onlineList()}>
              {(ch) => (
                <MenuSectionItem
                  channel={ch}
                  status="live"
                  selected={!watchActive() && props.selectedId === ch.user_id}
                  unread={hasUnread(ch.user_id)}
                  mentions={channelMentionCount(ch.user_id)}
                  onClick={() => props.onSelect(ch)}
                  onMiddleClick={() => openInBrowser(ch)}
                  onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                />
              )}
            </For>
          </Show>
        </MenuSection>
      </div>

      <MenuSection divider="top">
        <button
          type="button"
          onClick={() => setWatchActive(!watchActive())}
          title={
            watchActive()
              ? "Watch mode active — click to stop following"
              : selectedChannel()
                ? "Activate Watch mode"
                : !watchConnected()
                  ? "Install the browser extension to use Watch"
                  : "Open a Twitch channel in your browser"
          }
          class={`group relative w-full flex items-center justify-center px-2 py-3 cursor-pointer transition-colors ${
            watchActive() ? "" : "hover:bg-bg"
          }`}
        >
          <Show when={watchActive()}>
            <div class="absolute left-0 top-1 bottom-1 w-1 bg-highlight rounded-r" />
          </Show>
          <div class="relative shrink-0">
            <Show
              when={selectedChannel()}
              fallback={
                <div
                  class={`w-8 h-8 rounded-lg bg-bg-light flex items-center justify-center ${
                    watchActive() ? "text-text" : "text-text-muted"
                  } ${!watchConnected() && !watchActive() ? "opacity-40" : ""}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              }
            >
              {(ch) => (
                <>
                  <img
                    src={
                      ch().profile_image_url ||
                      "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"
                    }
                    alt={ch().user_name}
                    class="w-8 h-8 rounded-lg"
                  />
                  <Show when={watchActive()}>
                    <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg-dark flex items-center justify-center text-text">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  </Show>
                </>
              )}
            </Show>
          </div>
        </button>
      </MenuSection>

      <Show when={chMenu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            isPinned={pinnedIdSet().has(m().ch.user_id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setChMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={(ch) => pinChannel(ch.user_id)}
            onUnpin={unpinChannel}
          />
        )}
      </Show>

      <Show when={addPop()}>
        {(p) => (
          <InputPopover
            x={p().x}
            y={p().y}
            value={addInput()}
            loading={addLoading()}
            placeholder="Channel name"
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </div>
  );
}
