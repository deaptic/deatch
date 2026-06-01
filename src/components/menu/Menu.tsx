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
import { getFollowedStreams, getStreams, type Stream } from "../../lib/api/twitch/streams";
import { getUsers } from "../../lib/api/twitch/users";
import { fetchAllPages } from "../../lib/api/utils";
import { addToast } from "../../lib/stores/toasts";
import {
  rememberUser,
  setLiveStreams,
  selectedChannel,
} from "../../lib/stores/channels";
import {
  advancedDeveloperMode,
  menuChannelPinned,
  pinChannel,
  unpinChannel,
  reorderPinnedChannels,
} from "../../lib/stores/preferences";
import { hasUnread } from "../../lib/stores/feeds";
import { channelMentionCount } from "../../lib/stores/inbox";
import {
  watchMode,
  watchedChannel,
  watchWarmedChannels,
  watchMutedByLogin,
  setWatchMode,
} from "../../lib/stores/watch";
import { watchSetMuted } from "../../lib/api/watch";
import MenuSection from "./MenuSection";
import MenuSectionItem from "./MenuSectionItem";
import MenuAddButton from "./MenuAddButton";
import Navigation from "../ui/Navigation";
import SpeakerIcon from "../icons/SpeakerIcon";
import SpeakerOffIcon from "../icons/SpeakerOffIcon";
import WatchIcon from "../icons/WatchIcon";
import ChevronUpIcon from "../icons/ChevronUpIcon";
import ChevronDownIcon from "../icons/ChevronDownIcon";
import InputPopover from "../ui/InputPopover";
import ChannelContextMenu from "../context-menus/ChannelContextMenu";
import type { User } from "../../lib/types/twitch/user";

export type { User };

type Props = {
  onSelect: (ch: User, fromWatched?: boolean) => void;
  selectedId: string | null;
  onLiveChange?: (live: User[]) => void;
};


export default function Menu(props: Props) {
  const [live, setLive] = createStore<User[]>([]);
  const [pinnedMeta, setPinnedMeta] = createStore<Record<string, User>>({});
  const [loadingPinned, setLoadingPinned] = createSignal(true);
  const [loadingLive, setLoadingLive] = createSignal(true);

  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);

  const [chMenu, setChMenu] = createSignal<{
    ch: User;
    x: number;
    y: number;
  } | null>(null);

  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(
    null,
  );
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  let addBtn: HTMLButtonElement | undefined;

  const liveById = () => new Map(live.map((ch) => [ch?.id, ch]));
  const pinnedIdSet = () => new Set(menuChannelPinned());
  const warmedIdSet = () => new Set(watchWarmedChannels().map((ch) => ch?.id));
  const onlineList = () =>
    live.filter(
      (ch) => !pinnedIdSet().has(ch?.id) && !warmedIdSet().has(ch?.id),
    );
  const resolveChannel = (id: string): User | undefined =>
    liveById().get(id) ?? pinnedMeta[id];

  const [watchedCanScrollUp, setWatchedCanScrollUp] = createSignal(false);
  const [watchedCanScrollDown, setWatchedCanScrollDown] = createSignal(false);
  let watchedScrollEl: HTMLDivElement | undefined;
  function updateWatchedScrollState() {
    const el = watchedScrollEl;
    if (!el) {
      setWatchedCanScrollUp(false);
      setWatchedCanScrollDown(false);
      return;
    }
    setWatchedCanScrollUp(el.scrollTop > 0);
    setWatchedCanScrollDown(
      el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    );
  }
  createEffect(() => {
    watchWarmedChannels();
    queueMicrotask(updateWatchedScrollState);
  });

  const [mainCanScrollUp, setMainCanScrollUp] = createSignal(false);
  const [mainCanScrollDown, setMainCanScrollDown] = createSignal(false);
  let mainScrollEl: HTMLDivElement | undefined;
  function updateMainScrollState() {
    const el = mainScrollEl;
    if (!el) {
      setMainCanScrollUp(false);
      setMainCanScrollDown(false);
      return;
    }
    setMainCanScrollUp(el.scrollTop > 0);
    setMainCanScrollDown(
      el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    );
  }
  createEffect(() => {
    menuChannelPinned();
    live.length;
    queueMicrotask(updateMainScrollState);
  });

  function scrollByOneChannel(el: HTMLDivElement | undefined, direction: -1 | 1) {
    if (!el) return;
    const first = el.querySelector("[data-channel-id]") as HTMLElement | null;
    const step = first?.offsetHeight ?? 48;
    el.scrollBy({ top: direction * step, behavior: "smooth" });
  }

  createEffect(() => {
    const sel = selectedChannel();
    if (!sel) return;
    queueMicrotask(() => {
      const targets = document.querySelectorAll(
        `[data-channel-id="${sel.id}"]`,
      );
      for (const t of targets) {
        (t as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  });


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
      const extraIdList = [...extraIds];
      const extraStreams =
        extraIdList.length > 0
          ? await fetchAllPages<Stream>("get_streams", (after, opts) =>
              getStreams({ userIds: extraIdList, after }, opts),
            )
          : [];
      const streams = [...followed, ...extraStreams];

      setLiveStreams(streams);
      const data: User[] = [];
      if (streams.length > 0) {
        const users = await getUsers({ ids: streams.map((s) => s.user.id) });
        const byId = new Map(users.map((u) => [u.id, u]));
        for (const u of users) rememberUser(u);
        for (const s of streams) {
          const u = byId.get(s.user.id);
          if (u) data.push(u);
        }
      }
      setLive(reconcile(data, { key: "id" }));
      props.onLiveChange?.(data);
    } catch (e) {
      addToast(String(e), "error");
      // Signal the parent that the fetch settled (even unsuccessfully) so it
      // can stop waiting on us before proceeding with subscriptions.
      setLiveStreams([]);
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
        const updates: Record<string, User> = {};
        for (const u of users) {
          updates[u.id] = u;
          rememberUser(u);
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

  function openInBrowser(ch: User) {
    openUrl(`https://twitch.tv/${ch?.login}`);
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
      setPinnedMeta(u.id, u);
      rememberUser(u);
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
      <div class="relative flex-1 min-h-0">
        <Show when={mainCanScrollUp()}>
          <button
            type="button"
            onClick={() => scrollByOneChannel(mainScrollEl, -1)}
            class="absolute top-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-b from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
          >
            <ChevronUpIcon class="w-3 h-3" />
          </button>
        </Show>
        <Show when={mainCanScrollDown()}>
          <button
            type="button"
            onClick={() => scrollByOneChannel(mainScrollEl, 1)}
            class="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-t from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
          >
            <ChevronDownIcon class="w-3 h-3" />
          </button>
        </Show>
      <div
        ref={(el) => (mainScrollEl = el)}
        onScroll={updateMainScrollState}
        class="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MenuSection divider="bottom">
          <Navigation
            orientation="vertical"
            scroll={false}
            indicatorClass="bg-primary rounded-r-full"
          >
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
                        data-channel-id={id}
                        class="relative"
                        onMouseDown={(e) => startDrag(e, index())}
                      >
                        <Show when={isOver()}>
                          <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-primary rounded-full z-10" />
                        </Show>
                        <MenuSectionItem
                          channel={c()}
                          status={liveById().has(id) ? "live" : undefined}
                          selected={watchMode() === null && props.selectedId === id}
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
          </Navigation>
          <MenuAddButton ref={(el) => (addBtn = el)} onClick={openAdd} />
        </MenuSection>

        <MenuSection>
          <Navigation
            orientation="vertical"
            scroll={false}
            indicatorClass="bg-primary rounded-r-full"
          >
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
                <div data-channel-id={ch?.id}>
                  <MenuSectionItem
                    channel={ch}
                    status="live"
                    selected={watchMode() === null && props.selectedId === ch?.id}
                    unread={hasUnread(ch?.id)}
                    mentions={channelMentionCount(ch?.id)}
                    onClick={() => props.onSelect(ch)}
                    onMiddleClick={() => openInBrowser(ch)}
                    onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                  />
                </div>
              )}
            </For>
          </Show>
          </Navigation>
        </MenuSection>
        </div>
      </div>

      <Show when={watchWarmedChannels().length > 0}>
        <MenuSection divider="top">
          <div class="relative">
            <Show when={watchedCanScrollUp()}>
              <button
                type="button"
                onClick={() => scrollByOneChannel(watchedScrollEl, -1)}
                class="absolute top-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-b from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
              >
                <ChevronUpIcon class="w-3 h-3" />
              </button>
            </Show>
            <div
              ref={(el) => (watchedScrollEl = el)}
              onScroll={updateWatchedScrollState}
              class="flex flex-col max-h-[10.5rem] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Navigation
                orientation="vertical"
                scroll={false}
                indicatorClass="bg-primary rounded-r-full"
              >
              <For each={watchWarmedChannels()}>
                {(ch) => {
                  const isMuted = () => watchMutedByLogin()[ch?.login] === true;
                  return (
                    <div data-channel-id={ch?.id}>
                    <MenuSectionItem
                      channel={ch}
                      status={liveById().has(ch?.id) ? "live" : undefined}
                      selected={props.selectedId === ch?.id}
                      unread={hasUnread(ch?.id)}
                      mentions={channelMentionCount(ch?.id)}
                      onClick={() => props.onSelect(ch, true)}
                      onMiddleClick={() => openInBrowser(ch)}
                      onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                      bottomRight={
                        <div
                          role="button"
                          tabindex="0"
                          title={
                            isMuted() ? "Unmute browser tab" : "Mute browser tab"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            void watchSetMuted(ch?.login, !isMuted());
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          class={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg hover:bg-bg-light border border-border-muted flex items-center justify-center transition-colors cursor-pointer ${
                            isMuted()
                              ? "text-danger"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          <Show
                            when={isMuted()}
                            fallback={<SpeakerIcon class="w-3.5 h-3.5" />}
                          >
                            <SpeakerOffIcon class="w-3.5 h-3.5" />
                          </Show>
                        </div>
                      }
                    />
                    </div>
                  );
                }}
              </For>
              </Navigation>
            </div>
            <Show when={watchedCanScrollDown()}>
              <button
                type="button"
                onClick={() => scrollByOneChannel(watchedScrollEl, 1)}
                class="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center bg-gradient-to-t from-bg-dark to-transparent z-10 text-text-muted hover:text-text cursor-pointer"
              >
                <ChevronDownIcon class="w-3 h-3" />
              </button>
            </Show>
          </div>
        </MenuSection>
      </Show>

      <MenuSection divider="top">
        <button
          type="button"
          onClick={() => setWatchMode(watchMode() === null ? "auto" : null)}
          title={
            watchMode() === null
              ? "Click to start Watch mode"
              : "Click to stop Watch mode"
          }
          class="group w-full flex items-center justify-center px-2 py-3 cursor-pointer hover:bg-bg transition-colors"
        >
          <div class="relative shrink-0">
            <Show
              when={selectedChannel()}
              fallback={
                <div class="w-8 h-8 rounded-lg bg-bg-light flex items-center justify-center text-text-muted">
                  <WatchIcon class="w-4 h-4" />
                </div>
              }
            >
              {(ch) => (
                <img
                  src={
                    ch()?.profileImageUrl ||
                    "https://static-cdn.jtvnw.net/user-default-pictures-uec5k4/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png"
                  }
                  alt={ch()?.displayName}
                  class="w-8 h-8 rounded-lg"
                />
              )}
            </Show>
            <Show when={watchMode() !== null}>
              <div
                role="button"
                tabindex="0"
                title={
                  watchMode() === "manual"
                    ? "Manual — click to follow your browser tab"
                    : "Auto — click to lock on current"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setWatchMode(watchMode() === "manual" ? "auto" : "manual");
                }}
                onMouseDown={(e) => e.stopPropagation()}
                class={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg hover:bg-bg-light border border-border-muted flex items-center justify-center cursor-pointer transition-colors ${
                  watchMode() === "manual" ? "text-danger" : "text-emerald-500"
                }`}
              >
                <WatchIcon class="w-3.5 h-3.5" />
              </div>
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
            isPinned={pinnedIdSet().has(m().ch?.id)}
            developerMode={advancedDeveloperMode()}
            onClose={() => setChMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={(ch) => pinChannel(ch?.id)}
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
            placeholder="User name"
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </div>
  );
}
