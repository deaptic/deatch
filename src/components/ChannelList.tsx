import { Show, createSignal, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { createStore, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "../notifications";
import ChannelListPinned from "./ChannelListPinned";
import ChannelListOnline from "./ChannelListOnline";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import CopyIcon from "../icons/CopyIcon";
import { developerMode } from "../feed-prefs";
import type { TwitchStream, TwitchUser } from "../types";

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
  onPinnedChange?: (pinned: Channel[]) => void;
  onLiveChange?: (live: Channel[]) => void;
};

function loadPinned(): Channel[] {
  try { return JSON.parse(localStorage.getItem("pinned_channels") ?? "[]"); }
  catch { return []; }
}

function savePinned(pins: Channel[]) {
  localStorage.setItem("pinned_channels", JSON.stringify(
    pins.map(({ user_id, user_login, user_name, profile_image_url }) =>
      ({ user_id, user_login, user_name, profile_image_url }))
  ));
}

export default function ChannelList(props: Props) {
  const [pinned, setPinned] = createStore<Channel[]>(loadPinned());
  const [liveById, setLiveById] = createSignal<Map<string, Channel>>(new Map());
  const [menu, setMenu] = createSignal<{ ch: Channel; x: number; y: number } | null>(null);
  const [addPopover, setAddPopover] = createSignal<{ x: number; y: number } | null>(null);
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);
  const [pinnedLoading, setPinnedLoading] = createSignal(false);
  let addBtn: HTMLButtonElement | undefined;
  let refreshLive: () => Promise<void> = async () => {};

  const pinnedIds = () => new Set(pinned.map(p => p.user_id));

  onMount(() => {
    props.onPinnedChange?.(loadPinned());
  });

  function commitPinned(updated: Channel[]) {
    setPinned(reconcile(updated));
    savePinned(updated);
    props.onPinnedChange?.(updated);
  }

  function pin(ch: Channel) {
    if (pinned.some(p => p.user_id === ch.user_id)) return;
    commitPinned([...loadPinned(), ch]);
  }

  function unpin(user_id: string) {
    commitPinned(loadPinned().filter(p => p.user_id !== user_id));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const updated = loadPinned();
    const [item] = updated.splice(from, 1);
    updated.splice(from < to ? to - 1 : to, 0, item);
    commitPinned(updated);
  }

  function handleLiveUpdate(channels: Channel[]) {
    setLiveById(new Map(channels.map(ch => [ch.user_id, ch])));
    props.onLiveChange?.(channels);
  }

  async function refreshPinnedData() {
    const ids = pinned.map(p => p.user_id);
    if (ids.length === 0) return;
    setPinnedLoading(true);
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_id", { userIds: ids });
      const userMap = new Map(users.map(u => [u.id, u]));
      const updated = loadPinned().map(p => {
        const u = userMap.get(p.user_id);
        if (!u) return p;
        return {
          ...p,
          user_login: u.login,
          user_name: u.display_name,
          profile_image_url: u.profile_image_url ?? p.profile_image_url,
        };
      });
      commitPinned(updated);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setPinnedLoading(false);
    }
  }

  function openMenu(ch: Channel, x: number, y: number) {
    setMenu({ ch, x, y });
  }

  function openInBrowser(ch: Channel) {
    openUrl(`https://twitch.tv/${ch.user_login}`);
  }

  function openAdd() {
    if (!addBtn) return;
    const rect = addBtn.getBoundingClientRect();
    setAddInput("");
    setAddPopover({ x: rect.right + 8, y: rect.top });
  }

  function closeAdd() {
    setAddPopover(null);
    setAddInput("");
  }

  async function submitAdd() {
    const login = addInput().trim().toLowerCase();
    if (!login) return;
    if (pinned.some(p => p.user_login === login)) {
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

  return (
    <div class="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div class="border-b border-[#2d2d35]">
        <ChannelListPinned
          pinned={pinned}
          liveById={liveById()}
          loading={pinnedLoading()}
          onReorder={reorder}
          onSelect={props.onSelect}
          selectedId={props.selectedId}
          onContextMenu={openMenu}
          onMiddleClick={openInBrowser}
        />
        <button
          ref={addBtn}
          onClick={openAdd}
          title="Pin a channel"
          class={`w-full flex items-center justify-center p-2 hover:bg-[#2d2d35] transition-colors cursor-pointer text-[#5c5c7a] hover:text-white ${pinned.length === 0 ? "pt-2" : ""}`}
        >
          <div class="w-8 h-8 rounded-lg border-2 border-dashed border-[#3d3d4a] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </div>
        </button>
      </div>
      <ChannelListOnline
        pinnedIds={pinnedIds()}
        onSelect={props.onSelect}
        selectedId={props.selectedId}
        onLiveUpdate={handleLiveUpdate}
        onContextMenu={openMenu}
        onMiddleClick={openInBrowser}
        expose={(api) => { refreshLive = api.refresh; }}
      />
      <Show when={menu()}>
        {(m) => (
          <ContextMenu x={m().x} y={m().y} onClose={() => setMenu(null)}>
            <ContextMenuItem
              label="Open in browser"
              onClick={() => {
                openInBrowser(m().ch);
                setMenu(null);
              }}
            />
            <Show
              when={pinnedIds().has(m().ch.user_id)}
              fallback={
                <ContextMenuItem
                  label="Pin"
                  onClick={() => { pin(m().ch); setMenu(null); }}
                />
              }
            >
              <ContextMenuItem
                label="Unpin"
                onClick={() => { unpin(m().ch.user_id); setMenu(null); }}
              />
            </Show>
            <ContextMenuItem
              label="Refresh"
              onClick={() => {
                refreshLive();
                refreshPinnedData();
                setMenu(null);
              }}
            />
            <Show when={developerMode()}>
              <ContextMenuDivider />
              <ContextMenuItem
                label="Copy Payload"
                icon={<CopyIcon class="w-3.5 h-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(m().ch, null, 2));
                  setMenu(null);
                }}
              />
            </Show>
          </ContextMenu>
        )}
      </Show>
      <Show when={addPopover()}>
        {(p) => (
          <Portal>
            <div class="fixed inset-0 z-40" onClick={closeAdd} />
            <div
              style={{ position: "fixed", left: `${p().x}px`, top: `${p().y}px` }}
              class="z-50 w-64 bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl p-3 flex gap-2 items-center"
            >
              <input
                ref={(el) => setTimeout(() => el.focus())}
                type="text"
                placeholder="channel name"
                value={addInput()}
                onInput={(e) => setAddInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAdd();
                  if (e.key === "Escape") closeAdd();
                }}
                class="flex-1 bg-[#2d2d35] text-white text-xs rounded px-2 py-1.5 outline-none border border-[#3d3d4a] focus:border-[#9146ff] min-w-0"
              />
              <Show when={!addLoading()} fallback={<div class="w-4 h-4 rounded-full border-2 border-[#2d2d35] border-t-[#9146ff] animate-spin shrink-0" />}>
                <button onClick={submitAdd} class="text-[#9146ff] hover:text-white transition-colors cursor-pointer shrink-0" title="Add">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </button>
              </Show>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  );
}
