import { Show, For, createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "../../notifications";
import { user } from "../../user-state";
import { developerMode, pinnedChannels, pinChannel, unpinChannel, reorderPinnedChannels } from "../../user-prefs";
import { unreadCount } from "../../chat-feed";
import MenuSection from "./MenuSection";
import MenuSectionItem from "./MenuSectionItem";
import MenuAddButton from "./MenuAddButton";
import MenuAddPopover from "./MenuAddPopover";
import ChannelContextMenu from "../context-menus/ChannelContextMenu";
import AccountContextMenu from "../context-menus/AccountContextMenu";
import type { TwitchStream, TwitchUser } from "../../types";

export type { TwitchStream, TwitchUser };

export type Channel = {
  user_id: string;
  user_login: string;
  user_name: string;
  profile_image_url: string;
  game_name?: string;
  viewer_count?: number;
  title?: string;
  thumbnail_url?: string;
};

type Props = {
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onLiveChange?: (live: Channel[]) => void;
};

function userToChannel(u: TwitchUser): Channel {
  return {
    user_id: u.id,
    user_login: u.login,
    user_name: u.display_name,
    profile_image_url: u.profile_image_url ?? "",
  };
}

export default function Menu(props: Props) {
  const [live, setLive] = createStore<Channel[]>([]);
  const [pinnedMeta, setPinnedMeta] = createStore<Record<string, Channel>>({});
  const [loadingPinned, setLoadingPinned] = createSignal(true);
  const [loadingLive, setLoadingLive] = createSignal(true);

  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);

  const [chMenu, setChMenu] = createSignal<{ ch: Channel; x: number; y: number } | null>(null);
  const [accMenu, setAccMenu] = createSignal<{ x: number; y: number } | null>(null);

  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(null);
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  let addBtn: HTMLButtonElement | undefined;

  const liveById = () => new Map(live.map((ch) => [ch.user_id, ch]));
  const pinnedIdSet = () => new Set(pinnedChannels());
  const onlineList = () => live.filter((ch) => !pinnedIdSet().has(ch.user_id));
  const resolveChannel = (id: string): Channel | undefined => liveById().get(id) ?? pinnedMeta[id];

  async function fetchPinnedMeta() {
    const ids = pinnedChannels();
    if (ids.length === 0) {
      setLoadingPinned(false);
      return;
    }
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_id", { userIds: ids });
      const next: Record<string, Channel> = {};
      for (const u of users) next[u.id] = userToChannel(u);
      setPinnedMeta(reconcile(next));
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setLoadingPinned(false);
    }
  }

  async function fetchLive() {
    try {
      const followed = await invoke<TwitchStream[]>("get_followed_streams");
      const followedIds = new Set(followed.map((s) => s.user_id));
      const unfollowedPinnedIds = pinnedChannels().filter((id) => !followedIds.has(id));
      const pinnedStreams = unfollowedPinnedIds.length > 0
        ? await invoke<TwitchStream[]>("get_streams_by_user_id", { userIds: unfollowedPinnedIds })
        : [];
      const streams = [...followed, ...pinnedStreams];

      const profileMap = new Map<string, string>();
      if (streams.length > 0) {
        const users = await invoke<TwitchUser[]>("get_users_by_id", {
          userIds: streams.map((s) => s.user_id),
        });
        for (const u of users) profileMap.set(u.id, u.profile_image_url ?? "");
      }
      const data: Channel[] = streams.map((s) => ({
        user_id: s.user_id,
        user_login: s.user_login,
        user_name: s.user_name,
        game_name: s.game_name,
        title: s.title,
        viewer_count: s.viewer_count,
        thumbnail_url: s.thumbnail_url.replace("{width}", "440").replace("{height}", "248"),
        profile_image_url: profileMap.get(s.user_id) ?? "",
      }));
      setLive(reconcile(data, { key: "user_id" }));
      props.onLiveChange?.(data);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setLoadingLive(false);
    }
  }

  async function refresh() {
    setLoadingLive(true);
    await Promise.all([fetchPinnedMeta(), fetchLive()]);
  }

  // Fetch metadata for any newly-pinned channels we don't yet have data for.
  createEffect(() => {
    const missing = pinnedChannels().filter((id) => !pinnedMeta[id] && !liveById().get(id));
    if (missing.length === 0) return;
    invoke<TwitchUser[]>("get_users_by_id", { userIds: missing })
      .then((users) => {
        const updates: Record<string, Channel> = {};
        for (const u of users) updates[u.id] = userToChannel(u);
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
      const users = await invoke<TwitchUser[]>("get_users_by_login", { logins: [login] });
      const u = users[0];
      if (!u) throw new Error("User not found");
      if (pinnedChannels().includes(u.id)) {
        toast("Already pinned", "error");
        closeAdd();
        return;
      }
      setPinnedMeta(u.id, userToChannel(u));
      pinChannel(u.id);
      closeAdd();
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setAddLoading(false);
    }
  }

  function selectSelf() {
    const u = user();
    if (!u) return;
    props.onSelect({
      user_id: u.user_id,
      user_login: u.login,
      user_name: u.display_name,
      profile_image_url: u.profile_image_url,
    });
  }

  onMount(() => {
    fetchPinnedMeta();
    fetchLive();
    const id = setInterval(fetchLive, 60_000);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div class="flex flex-col h-full w-14 shrink-0 bg-[#18181b] border-r border-[#2d2d35] overflow-hidden">
      <div class="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MenuSection divider="bottom">
          <Show
            when={!loadingPinned()}
            fallback={
              <For each={pinnedChannels()}>
                {() => (
                  <div class="w-full flex items-center justify-center p-2">
                    <div class="w-8 h-8 rounded-lg bg-[#2d2d35] animate-pulse" />
                  </div>
                )}
              </For>
            }
          >
            <For each={pinnedChannels()}>
              {(id, index) => {
                const ch = () => resolveChannel(id);
                const isOver = () => overIdx() === index() && dragIdx() !== index();
                return (
                  <Show when={ch()}>
                    {(c) => (
                      <div
                        data-pinned-index={index()}
                        class="relative"
                        onMouseDown={(e) => startDrag(e, index())}
                      >
                        <Show when={isOver()}>
                          <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-[#9146ff] rounded-full z-10" />
                        </Show>
                        <MenuSectionItem
                          avatar={c().profile_image_url}
                          name={c().user_name}
                          game={c().game_name ?? "Offline"}
                          viewerCount={c().viewer_count}
                          status={liveById().has(id) ? "live" : undefined}
                          selected={props.selectedId === id}
                          unread={unreadCount(id)}
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
                    <div class="w-8 h-8 rounded-lg bg-[#2d2d35] animate-pulse" />
                  </div>
                ))}
              </>
            }
          >
            <For each={onlineList()}>
              {(ch) => (
                <MenuSectionItem
                  avatar={ch.profile_image_url}
                  name={ch.user_name}
                  game={ch.game_name ?? ""}
                  viewerCount={ch.viewer_count}
                  status="live"
                  selected={props.selectedId === ch.user_id}
                  unread={unreadCount(ch.user_id)}
                  onClick={() => props.onSelect(ch)}
                  onMiddleClick={() => openInBrowser(ch)}
                  onContextMenu={(x, y) => setChMenu({ ch, x, y })}
                />
              )}
            </For>
          </Show>
        </MenuSection>
      </div>

      <Show when={user()}>
        {(u) => (
          <MenuSection divider="top">
            <MenuSectionItem
              avatar={u().profile_image_url}
              name={u().display_name}
              status="self"
              selected={props.selectedId === u().user_id}
              unread={unreadCount(u().user_id)}
              square
              onClick={selectSelf}
              onContextMenu={(x, y) => setAccMenu({ x, y })}
            />
          </MenuSection>
        )}
      </Show>

      <Show when={chMenu()}>
        {(m) => (
          <ChannelContextMenu
            x={m().x}
            y={m().y}
            ch={m().ch}
            isPinned={pinnedIdSet().has(m().ch.user_id)}
            developerMode={developerMode()}
            onClose={() => setChMenu(null)}
            onOpenInBrowser={openInBrowser}
            onPin={(ch) => pinChannel(ch.user_id)}
            onUnpin={unpinChannel}
            onRefresh={refresh}
          />
        )}
      </Show>

      <Show when={accMenu()}>
        {(m) => (
          <AccountContextMenu
            x={m().x}
            y={m().y}
            onClose={() => setAccMenu(null)}
          />
        )}
      </Show>

      <Show when={addPop()}>
        {(p) => (
          <MenuAddPopover
            x={p().x}
            y={p().y}
            value={addInput()}
            loading={addLoading()}
            onInput={setAddInput}
            onSubmit={submitAdd}
            onClose={closeAdd}
          />
        )}
      </Show>
    </div>
  );
}
