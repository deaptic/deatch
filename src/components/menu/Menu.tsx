import { Show, For, createSignal, onMount, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "../../notifications";
import { user } from "../../user-state";
import { logout } from "../../auth";
import { developerMode } from "../../feed-prefs";
import { pinnedChannels, setPinnedChannels } from "../../menu-prefs";
import { unreadCount } from "../../chat-feed";
import MenuSection from "./MenuSection";
import MenuSectionItem from "./MenuSectionItem";
import MenuAddButton from "./MenuAddButton";
import MenuAddPopover from "./MenuAddPopover";
import ContextMenu from "../../ui/ContextMenu";
import ContextMenuItem from "../../ui/ContextMenuItem";
import ContextMenuDivider from "../../ui/ContextMenuDivider";
import CopyIcon from "../../icons/CopyIcon";
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

export default function Menu(props: Props) {
  const [live, setLive] = createStore<Channel[]>([]);
  const [loadingLive, setLoadingLive] = createSignal(true);
  const [loadingPinned, setLoadingPinned] = createSignal(false);

  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);

  const [chMenu, setChMenu] = createSignal<{ ch: Channel; x: number; y: number } | null>(null);
  const [accMenu, setAccMenu] = createSignal<{ x: number; y: number } | null>(null);

  const [addPop, setAddPop] = createSignal<{ x: number; y: number } | null>(null);
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  let addBtn: HTMLButtonElement | undefined;

  const liveById = () => new Map(live.map((ch) => [ch.user_id, ch]));
  const pinnedIds = () => new Set(pinnedChannels().map((p) => p.user_id));
  const onlineList = () => live.filter((ch) => !pinnedIds().has(ch.user_id));

  function pin(ch: Channel) {
    if (pinnedChannels().some((p) => p.user_id === ch.user_id)) return;
    setPinnedChannels([...pinnedChannels(), ch]);
  }

  function unpin(user_id: string) {
    setPinnedChannels(pinnedChannels().filter((p) => p.user_id !== user_id));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...pinnedChannels()];
    const [item] = next.splice(from, 1);
    next.splice(from < to ? to - 1 : to, 0, item);
    setPinnedChannels(next);
  }

  async function fetchLive() {
    try {
      const followed = await invoke<TwitchStream[]>("get_followed_streams");
      const followedIds = new Set(followed.map((s) => s.user_id));
      const unfollowedPinnedIds = pinnedChannels().map((p) => p.user_id).filter((id) => !followedIds.has(id));
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

  async function refreshLive() {
    setLoadingLive(true);
    await fetchLive();
  }

  async function refreshPinnedData() {
    const ids = pinnedChannels().map((p) => p.user_id);
    if (ids.length === 0) return;
    setLoadingPinned(true);
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_id", { userIds: ids });
      const userMap = new Map(users.map((u) => [u.id, u]));
      const updated = pinnedChannels().map((p) => {
        const u = userMap.get(p.user_id);
        if (!u) return p;
        return {
          ...p,
          user_login: u.login,
          user_name: u.display_name,
          profile_image_url: u.profile_image_url ?? p.profile_image_url,
        };
      });
      setPinnedChannels(updated);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setLoadingPinned(false);
    }
  }

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
      if (over !== null && over !== idx) reorder(idx, over);
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
    if (pinnedChannels().some((p) => p.user_login === login)) {
      toast("Already pinned", "error");
      closeAdd();
      return;
    }
    setAddLoading(true);
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_login", { logins: [login] });
      const u = users[0];
      if (!u) throw new Error("User not found");
      pin({
        user_id: u.id,
        user_login: u.login,
        user_name: u.display_name,
        profile_image_url: u.profile_image_url ?? "",
      });
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
              {(p, index) => {
                const ch = (): Channel => liveById().get(p.user_id) ?? p;
                const isOver = () => overIdx() === index() && dragIdx() !== index();
                return (
                  <div
                    data-pinned-index={index()}
                    class="relative"
                    onMouseDown={(e) => startDrag(e, index())}
                  >
                    <Show when={isOver()}>
                      <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-[#9146ff] rounded-full z-10" />
                    </Show>
                    <MenuSectionItem
                      avatar={ch().profile_image_url}
                      name={ch().user_name}
                      game={ch().game_name ?? "Offline"}
                      viewerCount={ch().viewer_count}
                      status={liveById().has(p.user_id) ? "live" : undefined}
                      selected={props.selectedId === p.user_id}
                      unread={unreadCount(p.user_id)}
                      dimmed={dragIdx() === index()}
                      onClick={() => props.onSelect(ch())}
                      onMiddleClick={() => openInBrowser(ch())}
                      onContextMenu={(x, y) => setChMenu({ ch: ch(), x, y })}
                    />
                  </div>
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
          <ContextMenu x={m().x} y={m().y} onClose={() => setChMenu(null)}>
            <ContextMenuItem
              label="Open in browser"
              onClick={() => { openInBrowser(m().ch); setChMenu(null); }}
            />
            <Show
              when={pinnedIds().has(m().ch.user_id)}
              fallback={
                <ContextMenuItem
                  label="Pin"
                  onClick={() => { pin(m().ch); setChMenu(null); }}
                />
              }
            >
              <ContextMenuItem
                label="Unpin"
                onClick={() => { unpin(m().ch.user_id); setChMenu(null); }}
              />
            </Show>
            <ContextMenuItem
              label="Refresh"
              onClick={() => {
                refreshLive();
                refreshPinnedData();
                setChMenu(null);
              }}
            />
            <Show when={developerMode()}>
              <ContextMenuDivider />
              <ContextMenuItem
                label="Copy Payload"
                icon={<CopyIcon class="w-3.5 h-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(m().ch, null, 2));
                  setChMenu(null);
                }}
              />
            </Show>
          </ContextMenu>
        )}
      </Show>

      <Show when={accMenu()}>
        {(m) => (
          <ContextMenu x={m().x} y={m().y} onClose={() => setAccMenu(null)}>
            <ContextMenuItem
              label="Log out"
              danger
              onClick={() => { setAccMenu(null); logout(); }}
            />
            <Show when={developerMode()}>
              <ContextMenuDivider />
              <ContextMenuItem
                label="Copy Payload"
                icon={<CopyIcon class="w-3.5 h-3.5" />}
                onClick={() => {
                  const u = user();
                  if (u) navigator.clipboard.writeText(JSON.stringify(u, null, 2));
                  setAccMenu(null);
                }}
              />
            </Show>
          </ContextMenu>
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
