import { createSignal, createEffect, onCleanup, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "./notifications";
import Sidebar, { Channel } from "./Sidebar";
import Chat from "./components/Chat";
import TitleBar from "./components/TitleBar";
import Settings from "./components/Settings";
import Loading from "./components/Loading";
import { settingsOpen } from "./settings-state";
import TwitchIcon from "./icons/TwitchIcon";
import ContextMenu from "./ui/ContextMenu";
import ContextMenuItem from "./ui/ContextMenuItem";
import ContextMenuDivider from "./ui/ContextMenuDivider";
import CopyIcon from "./icons/CopyIcon";
import { developerMode } from "./feed-prefs";
import {
  setGlobalEmotes,
  setUserEmotes,
  setSevenTvGlobal,
  setBttvGlobal,
  setFfzGlobal,
  setSevenTvChannel,
  setBttvChannel,
  setFfzChannel,
  fetchSevenTvGlobalEmotes,
  fetchBttvGlobalEmotes,
  fetchFfzGlobalEmotes,
  EmoteEntry,
} from "./emotes";
import { activeBroadcaster, setActiveBroadcaster } from "./broadcaster";
import type {
  UserInfo,
  ModeratedChannel,
  GlobalEmote,
  DeviceCode,
  UserEmote,
  SevenTvChannelResult,
  RawChatMessage,
  RawNotification,
  RawShoutout,
  RawFollow,
  BadgeSet,
} from "./types";
import { appendItem, setBadges, dropFeed, ensureFeed, snapshotDivider, markSeen, unreadCount } from "./chat-feed";
import { mutedUsers } from "./feed-prefs";
import {
  mapChatMessage,
  mapNotice,
  mapShoutout,
  mapFollow,
} from "./chat-events";
import { getTimestamp } from "./utils";
import type { BadgeMap } from "./components/ChatMessage";
import "./App.css";

// Module-scope so HMR / remounts can't reset them.
let globalBadgesPromise: Promise<BadgeSet[]> | null = null;
let thirdPartyGlobalsFetched = false;
let userScopedFetched = false;
const badgesByChannel = new Map<string, Promise<BadgeMap>>();
const sevenTvChannelCache = new Map<string, Promise<EmoteEntry[]>>();
const bttvChannelCache = new Map<string, Promise<EmoteEntry[]>>();
const ffzChannelCache = new Map<string, Promise<EmoteEntry[]>>();

function resetUserScopedCaches() {
  userScopedFetched = false;
  badgesByChannel.clear();
  sevenTvChannelCache.clear();
  bttvChannelCache.clear();
  ffzChannelCache.clear();
}

function App() {
  const [waiting, setWaiting] = createSignal(false);
  const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
  const [user, setUser] = createSignal<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = createSignal(false);
  const [selectedChannel, setSelectedChannel] = createSignal<Channel | null>(null);
  const [moderatedChannels, setModeratedChannels] = createSignal<ModeratedChannel[]>([]);
  const [userMenu, setUserMenu] = createSignal<{ x: number; y: number } | null>(null);
  const [pinnedChannels, setPinnedChannels] = createSignal<Channel[]>([]);
  const [liveChannels, setLiveChannels] = createSignal<Channel[]>([]);

  const joinedIds = new Set<string>();

  function isModOf(broadcasterId: string): boolean {
    const u = user();
    if (!u) return false;
    if (broadcasterId === u.user_id) return true;
    return moderatedChannels().some((m) => m.broadcaster_id === broadcasterId);
  }

  function getGlobalBadges(): Promise<BadgeSet[]> {
    if (!globalBadgesPromise) {
      globalBadgesPromise = invoke<BadgeSet[]>("get_global_chat_badges").catch(() => [] as BadgeSet[]);
    }
    return globalBadgesPromise;
  }

  function fetchBadgesFor(broadcasterId: string): Promise<BadgeMap> {
    let cached = badgesByChannel.get(broadcasterId);
    if (cached) {
      cached.then((map) => setBadges(broadcasterId, map));
      return cached;
    }
    cached = Promise.all([
      getGlobalBadges(),
      invoke<BadgeSet[]>("get_channel_chat_badges", { broadcasterId }).catch(() => [] as BadgeSet[]),
    ]).then(([global, channel]) => {
      const map: BadgeMap = {};
      for (const set of global)
        for (const v of set.versions)
          map[`${set.set_id}/${v.id}`] = { url: v.image_url_1x, title: v.title };
      for (const set of channel)
        for (const v of set.versions)
          map[`${set.set_id}/${v.id}`] = { url: v.image_url_1x, title: v.title };
      setBadges(broadcasterId, map);
      return map;
    });
    badgesByChannel.set(broadcasterId, cached);
    return cached;
  }

  async function joinChannel(broadcasterId: string) {
    if (joinedIds.has(broadcasterId)) return;
    joinedIds.add(broadcasterId);
    ensureFeed(broadcasterId);
    fetchBadgesFor(broadcasterId);
    try {
      await invoke("add_chat_channel", { broadcasterId, isMod: isModOf(broadcasterId) });
    } catch (e) {
      joinedIds.delete(broadcasterId);
      toast(String(e), "error");
    }
  }

  async function leaveChannel(broadcasterId: string) {
    if (!joinedIds.has(broadcasterId)) return;
    joinedIds.delete(broadcasterId);
    try {
      await invoke("remove_chat_channel", { broadcasterId });
    } catch (e) {
      toast(String(e), "error");
    }
    dropFeed(broadcasterId);
  }

  function fetchUserScopedData() {
    if (userScopedFetched) return;
    userScopedFetched = true;
    invoke<ModeratedChannel[]>("get_moderated_channels")
      .then(setModeratedChannels)
      .catch(() => {});
    invoke<GlobalEmote[]>("get_global_emotes").then(setGlobalEmotes).catch(() => {});
    invoke<UserEmote[]>("get_user_emotes").then(setUserEmotes).catch(() => {});
  }

  createEffect(() => {
    const broadcaster = activeBroadcaster();
    if (!broadcaster) {
      setSevenTvChannel([]);
      setBttvChannel([]);
      setFfzChannel([]);
      return;
    }
    let sevenTv = sevenTvChannelCache.get(broadcaster.id);
    if (!sevenTv) {
      sevenTv = invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId: broadcaster.id })
        .then((r) => r.emotes)
        .catch(() => []);
      sevenTvChannelCache.set(broadcaster.id, sevenTv);
    }
    sevenTv.then(setSevenTvChannel);

    let bttv = bttvChannelCache.get(broadcaster.id);
    if (!bttv) {
      bttv = invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId: broadcaster.id })
        .catch(() => [] as EmoteEntry[]);
      bttvChannelCache.set(broadcaster.id, bttv);
    }
    bttv.then(setBttvChannel);

    let ffz = ffzChannelCache.get(broadcaster.id);
    if (!ffz) {
      ffz = invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin: broadcaster.login })
        .catch(() => [] as EmoteEntry[]);
      ffzChannelCache.set(broadcaster.id, ffz);
    }
    ffz.then(setFfzChannel);
  });

  // Maintain the joined set: pinned ∪ live ∪ {selected} ∪ {self}.
  createEffect(() => {
    const u = user();
    if (!u) return;
    const desired = new Set<string>();
    desired.add(u.user_id);
    for (const ch of pinnedChannels()) desired.add(ch.user_id);
    for (const ch of liveChannels()) desired.add(ch.user_id);
    const sel = selectedChannel();
    if (sel) desired.add(sel.user_id);

    for (const id of desired) {
      if (!joinedIds.has(id)) joinChannel(id);
    }
    for (const id of [...joinedIds]) {
      if (!desired.has(id)) leaveChannel(id);
    }
  });

  onMount(() => {
    if (!thirdPartyGlobalsFetched) {
      thirdPartyGlobalsFetched = true;
      fetchSevenTvGlobalEmotes().then(setSevenTvGlobal).catch(() => {});
      fetchBttvGlobalEmotes().then(setBttvGlobal).catch(() => {});
      fetchFfzGlobalEmotes().then(setFfzGlobal).catch(() => {});
    }

    let unlistenSuccess: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    const chatUnlistens: (() => void)[] = [];
    onCleanup(() => {
      unlistenSuccess?.();
      unlistenError?.();
      chatUnlistens.forEach((fn) => fn());
    });

    listen<RawChatMessage>("chat-message", (e) => {
      const id = e.payload.broadcaster_user_id;
      if (mutedUsers().some((u) => u.toLowerCase() === e.payload.chatter_user_login.toLowerCase())) return;
      appendItem(id, mapChatMessage(e.payload, getTimestamp()));
    }).then((fn) => chatUnlistens.push(fn));

    listen<RawNotification>("chat-notification", (e) => {
      const id = e.payload.broadcaster_user_id;
      const item = mapNotice(e.payload, getTimestamp());
      if (e.payload.notice_type === "sub_gift") {
        setTimeout(() => appendItem(id, item), 600);
      } else {
        appendItem(id, item);
      }

      if (
        e.payload.notice_type === "raid" &&
        e.payload.chatter_user_id &&
        isModOf(id) &&
        localStorage.getItem("auto_shoutout") === "true" &&
        selectedChannel()?.user_id === id
      ) {
        invoke("send_shoutout", {
          fromBroadcasterId: id,
          toBroadcasterId: e.payload.chatter_user_id,
        });
      }
    }).then((fn) => chatUnlistens.push(fn));

    listen<RawShoutout>("chat-shoutout-create", (e) => {
      appendItem(e.payload.broadcaster_user_id, mapShoutout(e.payload, getTimestamp()));
    }).then((fn) => chatUnlistens.push(fn));

    listen<RawFollow>("channel-follow", (e) => {
      appendItem(e.payload.broadcaster_user_id, mapFollow(e.payload, getTimestamp()));
    }).then((fn) => chatUnlistens.push(fn));

    listen<string>("chat-error", (e) => {
      console.error("Chat error:", e.payload);
    }).then((fn) => chatUnlistens.push(fn));

    (async () => {
      try {
        const u = await invoke<UserInfo>("try_restore_session");
        setUser(u);
        fetchUserScopedData();
      } catch {
        // No stored session — user will log in manually
      } finally {
        setAuthChecked(true);
      }

      unlistenSuccess = await listen<UserInfo>("twitch-auth-success", (e) => {
        setWaiting(false);
        setDeviceCode(null);
        setUser(e.payload);
        fetchUserScopedData();
        toast("Connected to Twitch!", "success");
      });
      unlistenError = await listen<string>("twitch-auth-error", (e) => {
        setWaiting(false);
        setDeviceCode(null);
        toast(e.payload, "error");
      });
    })();
  });

  async function loginWithTwitch() {
    try {
      setDeviceCode(null);
      const code = await invoke<DeviceCode>("start_dcf_auth");
      setDeviceCode(code);
      setWaiting(true);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  function cancelAuth() {
    setWaiting(false);
    setDeviceCode(null);
  }

  async function handleLogout() {
    try {
      await invoke("revoke_access_token");
      for (const id of [...joinedIds]) await leaveChannel(id);
      resetUserScopedCaches();
      setUser(null);
      setSelectedChannel(null);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  function handleChannelSelect(ch: Channel) {
    const prev = activeBroadcaster();
    if (prev && prev.id !== ch.user_id) snapshotDivider(prev.id);
    setSelectedChannel(ch);
    setActiveBroadcaster({ id: ch.user_id, login: ch.user_login, name: ch.user_name });
    ensureFeed(ch.user_id);
    markSeen(ch.user_id);
  }

  createEffect(() => {
    const u = user();
    if (u && !selectedChannel()) {
      handleChannelSelect({
        user_id: u.user_id,
        user_login: u.login,
        user_name: u.display_name,
        profile_image_url: u.profile_image_url,
      });
    }
  });

  return (
    <div class="flex flex-col h-screen bg-[#0e0e10] relative">
      <TitleBar />
      <Show when={settingsOpen()}><Settings /></Show>
    <Show
      when={user()}
      fallback={<Show when={authChecked()} fallback={<main class="flex-1 bg-[#0e0e10] flex items-center justify-center"><Loading size={48} /></main>}>{
        <main class="flex-1 bg-[#0e0e10] flex items-center justify-center">
          <div class="flex flex-col items-center gap-8">
            <div class="flex items-center gap-3">
              <TwitchIcon class="w-12 h-12 fill-[#9146ff]" />
              <span class="text-white text-3xl font-bold tracking-tight">Deatch</span>
            </div>

            <div class="bg-[#1f1f23] border border-[#2d2d35] rounded-2xl p-10 flex flex-col items-center gap-6 w-80 shadow-2xl">
              {waiting() ? (
                <>
                  <Show
                    when={deviceCode()}
                    fallback={<Loading size={56} />}
                  >
                    {(code) => (
                      <div class="flex flex-col items-center gap-4 w-full">
                        <div class="text-center flex flex-col gap-1">
                          <p class="text-white font-semibold">Activate on Twitch</p>
                          <p class="text-[#adadb8] text-sm">
                            Go to <span class="text-[#9146ff]">twitch.tv/activate</span> and enter this code:
                          </p>
                        </div>
                        <div class="bg-[#0e0e10] border border-[#9146ff] rounded-xl px-6 py-4 w-full text-center">
                          <span class="text-white text-2xl font-mono font-bold tracking-[0.25em]">
                            {code().user_code}
                          </span>
                        </div>
                        <a
                          href={code().verification_uri}
                          target="_blank"
                          class="text-[#9146ff] hover:text-[#bf94ff] text-sm underline transition-colors"
                        >
                          Open twitch.tv/activate
                        </a>
                      </div>
                    )}
                  </Show>
                  <button
                    onClick={cancelAuth}
                    class="text-[#5c5c7a] hover:text-white text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div class="text-center flex flex-col gap-1">
                    <h2 class="text-white text-xl font-semibold">Welcome back</h2>
                    <p class="text-[#adadb8] text-sm">Connect your Twitch account to get started</p>
                  </div>
                  <button
                    onClick={loginWithTwitch}
                    class="w-full flex items-center justify-center gap-3 bg-[#9146ff] hover:bg-[#7d2df1] active:bg-[#6a1fd4] transition-colors duration-150 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer"
                  >
                    <TwitchIcon class="w-5 h-5 fill-white" />
                    Login with Twitch
                  </button>
                  <p class="text-[#5c5c7a] text-xs text-center">
                    Your credentials are never stored by this app
                  </p>
                </>
              )}
            </div>
          </div>
        </main>
      }</Show>}
    >
      {(u) => (
        <div class="flex flex-1 min-h-0 bg-[#0e0e10] overflow-hidden">
          <div class="flex flex-col h-full shrink-0 w-14">
            <button
              class={`flex items-center justify-center border-b border-r border-[#2d2d35] shrink-0 px-2 h-14 transition-colors cursor-pointer ${selectedChannel()?.user_id === u().user_id ? "bg-[#3d3d4a]" : "bg-[#18181b] hover:bg-[#2d2d35]"}`}
              onClick={() => handleChannelSelect({
                user_id: u().user_id,
                user_login: u().login,
                user_name: u().display_name,
                profile_image_url: u().profile_image_url,
              })}
              onContextMenu={(e) => {
                e.preventDefault();
                setUserMenu({ x: e.clientX, y: e.clientY });
              }}
              title={u().display_name}
            >
              <div class="relative shrink-0">
                <img
                  src={u().profile_image_url}
                  alt={u().display_name}
                  class="w-8 h-8 rounded-lg"
                />
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1f1f23]" />
                <Show when={unreadCount(u().user_id) > 0}>
                  <div class="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-[#9146ff] rounded-full border-2 border-[#1f1f23] flex items-center justify-center">
                    <span class="text-[9px] font-bold text-white leading-none tabular-nums">
                      {unreadCount(u().user_id) > 99 ? "99+" : unreadCount(u().user_id)}
                    </span>
                  </div>
                </Show>
              </div>
            </button>
            <Sidebar
              onSelect={handleChannelSelect}
              selectedId={selectedChannel()?.user_id ?? null}
              onPinnedChange={setPinnedChannels}
              onLiveChange={setLiveChannels}
            />
          </div>

          <Show when={userMenu()}>
            {(m) => (
              <ContextMenu x={m().x} y={m().y} onClose={() => setUserMenu(null)}>
                <ContextMenuItem
                  label="Log out"
                  danger
                  onClick={() => { setUserMenu(null); handleLogout(); }}
                />
                <Show when={developerMode()}>
                  <ContextMenuDivider />
                  <ContextMenuItem
                    label="Copy Payload"
                    icon={<CopyIcon class="w-3.5 h-3.5" />}
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(u(), null, 2));
                      setUserMenu(null);
                    }}
                  />
                </Show>
              </ContextMenu>
            )}
          </Show>

          <main class="flex-1 overflow-hidden flex flex-col">
            <Show
              when={selectedChannel()}
              fallback={
                <div class="flex items-center justify-center flex-1">
                  <p class="text-[#5c5c7a] text-sm">Select a channel to view chat</p>
                </div>
              }
            >
              {(ch) => (
                <Chat
                  broadcasterId={ch().user_id}
                  broadcasterLogin={ch().user_login}
                  userLogin={u().login}
                  moderatedChannels={moderatedChannels()}
                />
              )}
            </Show>
          </main>
        </div>
      )}
    </Show>
    </div>
  );
}

export default App;
