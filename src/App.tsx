import { createSignal, createEffect, onCleanup, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "./notifications";
import Sidebar, { Channel } from "./Sidebar";
import Chat from "./components/Chat";
import ChatTitleBar from "./components/ChatTitleBar";
import TwitchIcon from "./icons/TwitchIcon";
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
import type { UserInfo, ModeratedChannel, GlobalEmote, DeviceCode, UserEmote, SevenTvChannelResult } from "./types";
import "./App.css";

function App() {
  const [waiting, setWaiting] = createSignal(false);
  const [deviceCode, setDeviceCode] = createSignal<DeviceCode | null>(null);
  const [user, setUser] = createSignal<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = createSignal(false);
  const [selectedChannel, setSelectedChannel] = createSignal<Channel | null>(null);
  const [moderatedChannels, setModeratedChannels] = createSignal<ModeratedChannel[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(
    localStorage.getItem("sidebar_collapsed") === "1"
  );

  function toggleSidebar() {
    setSidebarCollapsed(c => {
      const next = !c;
      localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  function fetchStartupData() {
    invoke<ModeratedChannel[]>("get_moderated_channels")
      .then(setModeratedChannels)
      .catch(() => {});
    invoke<GlobalEmote[]>("get_global_emotes").then(setGlobalEmotes).catch(() => {});
    invoke<UserEmote[]>("get_user_emotes").then(setUserEmotes).catch(() => {});
    fetchSevenTvGlobalEmotes().then(setSevenTvGlobal).catch(() => {});
    fetchBttvGlobalEmotes().then(setBttvGlobal).catch(() => {});
    fetchFfzGlobalEmotes().then(setFfzGlobal).catch(() => {});
  }

  createEffect(() => {
    const broadcaster = activeBroadcaster();
    if (!broadcaster) {
      setSevenTvChannel([]);
      setBttvChannel([]);
      setFfzChannel([]);
      return;
    }
    invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId: broadcaster.id })
      .then((r) => setSevenTvChannel(r.emotes))
      .catch(() => setSevenTvChannel([]));
    invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId: broadcaster.id })
      .then(setBttvChannel)
      .catch(() => setBttvChannel([]));
    invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin: broadcaster.login })
      .then(setFfzChannel)
      .catch(() => setFfzChannel([]));
  });

  onMount(() => {
    let unlistenSuccess: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    onCleanup(() => {
      unlistenSuccess?.();
      unlistenError?.();
    });

    (async () => {
      try {
        const u = await invoke<UserInfo>("try_restore_session");
        setUser(u);
        fetchStartupData();
      } catch {
        // No stored session — user will log in manually
      } finally {
        setAuthChecked(true);
      }

      unlistenSuccess = await listen<UserInfo>("twitch-auth-success", (e) => {
        setWaiting(false);
        setDeviceCode(null);
        setUser(e.payload);
        fetchStartupData();
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
      setUser(null);
      setSelectedChannel(null);
    } catch (e) {
      toast(String(e), "error");
    }
  }

  async function handleChannelSelect(ch: Channel) {
    setSelectedChannel(ch);
    setActiveBroadcaster({ id: ch.user_id, login: ch.user_login, name: ch.user_name });
    const isMod =
      ch.user_id === user()?.user_id ||
      moderatedChannels().some((m) => m.broadcaster_id === ch.user_id);
    try {
      await invoke("start_chat", { broadcasterId: ch.user_id, isMod });
    } catch (e) {
      toast(String(e), "error");
    }
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
    <Show
      when={user()}
      fallback={<Show when={authChecked()} fallback={<main class="min-h-screen bg-[#0e0e10] flex items-center justify-center"><div class="w-6 h-6 border-2 border-[#9146ff] border-t-transparent rounded-full animate-spin" /></main>}>{
        <main class="min-h-screen bg-[#0e0e10] flex items-center justify-center">
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
                    fallback={
                      <div class="w-10 h-10 rounded-full border-4 border-[#2d2d35] border-t-[#9146ff] animate-spin" />
                    }
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
        <div class="flex h-screen bg-[#0e0e10] overflow-hidden">
          <div class={`flex flex-col h-full shrink-0 ${sidebarCollapsed() ? "w-14" : "w-56"}`}>
            <div class={`flex items-center border-b border-r border-[#2d2d35] bg-[#1f1f23] shrink-0 ${sidebarCollapsed() ? "flex-col gap-2 px-2 py-3" : "gap-3 px-4 py-3"}`}>
              <button
                class={`flex items-center cursor-pointer hover:opacity-80 transition-opacity text-left ${sidebarCollapsed() ? "" : "gap-3 min-w-0 flex-1"}`}
                onClick={() => handleChannelSelect({
                  user_id: u().user_id,
                  user_login: u().login,
                  user_name: u().display_name,
                  profile_image_url: u().profile_image_url,
                })}
                title={sidebarCollapsed() ? u().display_name : undefined}
              >
                <div class="relative shrink-0">
                  <img
                    src={u().profile_image_url}
                    alt={u().display_name}
                    class="w-8 h-8 rounded-lg"
                  />
                  <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1f1f23]" />
                </div>
                <Show when={!sidebarCollapsed()}>
                  <div class="min-w-0 flex-1">
                    <p class="text-white text-sm font-semibold truncate">{u().display_name}</p>
                    <p class="text-[#9146ff] text-xs truncate">@{u().login}</p>
                  </div>
                </Show>
              </button>
              <Show when={!sidebarCollapsed()}>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  class="shrink-0 text-[#5c5c7a] hover:text-white transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.08a.75.75 0 10-1.004-1.114l-2.5 2.572a.75.75 0 000 1.044l2.5 2.572a.75.75 0 101.004-1.114l-1.048-1.08h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
                  </svg>
                </button>
              </Show>
            </div>
            <Sidebar onSelect={handleChannelSelect} selectedId={selectedChannel()?.user_id ?? null} collapsed={sidebarCollapsed()} />
          </div>

          <main class="flex-1 overflow-hidden flex flex-col">
            <Show
              when={selectedChannel()}
              fallback={
                <>
                  <ChatTitleBar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed()} />
                  <div class="flex items-center justify-center flex-1">
                    <p class="text-[#5c5c7a] text-sm">Select a channel to view chat</p>
                  </div>
                </>
              }
            >
              {(ch) => (
                <Chat
                  broadcasterName={ch().user_name}
                  broadcasterId={ch().user_id}
                  broadcasterLogin={ch().user_login}
                  userLogin={u().login}
                  moderatedChannels={moderatedChannels()}
                  sidebarCollapsed={sidebarCollapsed()}
                  onToggleSidebar={toggleSidebar}
                />
              )}
            </Show>
          </main>
        </div>
      )}
    </Show>
  );
}

export default App;
