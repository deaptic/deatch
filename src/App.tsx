import { createSignal, createEffect, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { enable as enableAutostart, disable as disableAutostart } from "@tauri-apps/plugin-autostart";
import { getAllModeratedChannels } from "./commands/moderation";
import {
  getGlobalChatBadges,
  getChannelChatBadges,
  getGlobalEmotes,
} from "./commands/chat";
import { addToast } from "./state/toasts";
import Menu, { type Channel } from "./components/menu/Menu";
import Feed from "./components/feed/Feed";
import TitleBar from "./components/TitleBar";
import Settings from "./components/settings/Settings";
import Inbox from "./components/inbox/Inbox";
import Loading from "./components/Loading";
import { menuChannelPinned, advancedAlwaysOnTop, advancedAutostart } from "./state/preferences";
import { user, moderatedChannels, setModeratedChannels } from "./state/users";
import {
  waiting,
  deviceCode,
  authChecked,
  login,
  cancel,
} from "./state/auth";
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
  fetchAllUserEmotes,
  EmoteEntry,
} from "./state/emotes";
import { selectedChannel, setSelectedChannel, channelsById, rememberChannel } from "./state/channels";
import { markMentionRead, markChannelMentionsRead } from "./state/inbox";
import type {
  SevenTvChannelResult,
  BadgeSet,
} from "./types";
import { setBadges, dropFeed, ensureFeed, snapshotDivider, markSeen } from "./components/feed/feeds";
import type { BadgeMap } from "./components/feed/types";
import "./events";
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
  const [liveChannels, setLiveChannels] = createSignal<Channel[]>([]);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [inboxOpen, setInboxOpen] = createSignal(false);

  const joinedIds = new Set<string>();

  function isModOf(broadcasterId: string): boolean {
    const u = user();
    if (!u) return false;
    if (broadcasterId === u.id) return true;
    return moderatedChannels().some((m) => m.broadcaster_id === broadcasterId);
  }

  function getGlobalBadges(): Promise<BadgeSet[]> {
    if (!globalBadgesPromise) {
      globalBadgesPromise = getGlobalChatBadges().catch(() => [] as BadgeSet[]);
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
      getChannelChatBadges({ broadcasterId }).catch(() => [] as BadgeSet[]),
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
      addToast(String(e), "error");
    }
  }

  async function leaveChannel(broadcasterId: string) {
    if (!joinedIds.has(broadcasterId)) return;
    joinedIds.delete(broadcasterId);
    try {
      await invoke("remove_chat_channel", { broadcasterId });
    } catch (e) {
      addToast(String(e), "error");
    }
    dropFeed(broadcasterId);
  }

  function fetchUserScopedData() {
    if (userScopedFetched) return;
    userScopedFetched = true;
    getAllModeratedChannels()
      .then(setModeratedChannels)
      .catch(() => {});
    getGlobalEmotes().then(setGlobalEmotes).catch(() => {});
    fetchAllUserEmotes().then(setUserEmotes).catch(() => {});
  }

  createEffect(() => {
    const broadcaster = selectedChannel();
    if (!broadcaster) {
      setSevenTvChannel([]);
      setBttvChannel([]);
      setFfzChannel([]);
      return;
    }
    let sevenTv = sevenTvChannelCache.get(broadcaster.user_id);
    if (!sevenTv) {
      sevenTv = invoke<SevenTvChannelResult>("seventv_get_channel_emotes", { channelId: broadcaster.user_id })
        .then((r) => r.emotes)
        .catch(() => []);
      sevenTvChannelCache.set(broadcaster.user_id, sevenTv);
    }
    sevenTv.then(setSevenTvChannel);

    let bttv = bttvChannelCache.get(broadcaster.user_id);
    if (!bttv) {
      bttv = invoke<EmoteEntry[]>("bttv_get_channel_emotes", { channelId: broadcaster.user_id })
        .catch(() => [] as EmoteEntry[]);
      bttvChannelCache.set(broadcaster.user_id, bttv);
    }
    bttv.then(setBttvChannel);

    let ffz = ffzChannelCache.get(broadcaster.user_id);
    if (!ffz) {
      ffz = invoke<EmoteEntry[]>("ffz_get_channel_emotes", { channelLogin: broadcaster.user_login })
        .catch(() => [] as EmoteEntry[]);
      ffzChannelCache.set(broadcaster.user_id, ffz);
    }
    ffz.then(setFfzChannel);
  });

  // Maintain the joined set: pinned ∪ live ∪ {selected} ∪ {self}.
  createEffect(() => {
    const u = user();
    if (!u) return;
    const desired = new Set<string>();
    desired.add(u.id);
    for (const id of menuChannelPinned()) desired.add(id);
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
  });

  createEffect(() => {
    getCurrentWindow().setAlwaysOnTop(advancedAlwaysOnTop()).catch(() => {});
  });

  createEffect(() => {
    const on = advancedAutostart();
    (on ? enableAutostart() : disableAutostart()).catch(() => {});
  });

  createEffect(() => {
    if (user() !== null) {
      fetchUserScopedData();
      return;
    }
    for (const id of [...joinedIds]) leaveChannel(id);
    resetUserScopedCaches();
    setSelectedChannel(null);
  });

  function handleChannelSelect(ch: Channel) {
    const prev = selectedChannel();
    if (prev && prev.user_id !== ch.user_id) snapshotDivider(prev.user_id);
    rememberChannel(ch);
    setSelectedChannel(ch);
    ensureFeed(ch.user_id);
    markSeen(ch.user_id);
    markChannelMentionsRead(ch.user_id);
  }

  function jumpToMessage(channelId: string, messageId: string) {
    const ch = channelsById.get(channelId);
    const needsSwitch = !!ch && selectedChannel()?.user_id !== channelId;
    if (needsSwitch) handleChannelSelect(ch);
    const doJump = () => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.backgroundColor = "color-mix(in oklab, var(--color-primary) 35%, transparent)";
      const clear = () => {
        el.style.transition = "background-color 0.3s ease";
        el.style.backgroundColor = "";
        el.removeEventListener("mouseenter", clear);
      };
      el.addEventListener("mouseenter", clear);
    };
    if (needsSwitch) setTimeout(doJump, 100);
    else doJump();
  }

  createEffect(() => {
    const u = user();
    if (u && !selectedChannel()) {
      handleChannelSelect({
        user_id: u.id,
        user_login: u.login,
        user_name: u.display_name,
        profile_image_url: u.profile_image_url ?? "",
      });
    }
  });

  return (
    <div class="flex flex-col h-screen bg-bg-dark relative">
      <TitleBar
        settingsOpen={settingsOpen()}
        inboxOpen={inboxOpen()}
        onToggleSettings={() => setSettingsOpen((o) => !o)}
        onToggleInbox={() => setInboxOpen((o) => !o)}
      />
      <Show when={settingsOpen()}><Settings onClose={() => setSettingsOpen(false)} /></Show>
      <Show when={inboxOpen()}>
        <Inbox
          onClose={() => setInboxOpen(false)}
          onJump={(channelId, messageId) => {
            markMentionRead(messageId);
            jumpToMessage(channelId, messageId);
          }}
        />
      </Show>
    <Show
      when={user()}
      fallback={<Show when={authChecked()} fallback={<main class="flex-1 bg-bg-dark flex items-center justify-center"><Loading size={48} /></main>}>{
        <main class="flex-1 bg-bg-dark flex items-center justify-center">
          <div class="flex flex-col items-center gap-8">
            <div class="flex items-center gap-3">
              <TwitchIcon class="w-12 h-12 fill-primary" />
              <span class="text-text text-3xl font-bold tracking-tight">Deatch</span>
            </div>

            <div class="bg-bg border border-border-muted rounded-2xl p-10 flex flex-col items-center gap-6 w-80 shadow-2xl">
              {waiting() ? (
                <>
                  <Show
                    when={deviceCode()}
                    fallback={<Loading size={56} />}
                  >
                    {(code) => (
                      <div class="flex flex-col items-center gap-4 w-full">
                        <div class="text-center flex flex-col gap-1">
                          <p class="text-text font-semibold">Activate on Twitch</p>
                          <p class="text-text-muted text-sm">
                            Go to <span class="text-primary">twitch.tv/activate</span> and enter this code:
                          </p>
                        </div>
                        <div class="bg-bg-dark border border-primary rounded-xl px-6 py-4 w-full text-center">
                          <span class="text-text text-2xl font-mono font-bold tracking-[0.25em]">
                            {code().user_code}
                          </span>
                        </div>
                        <a
                          href={code().verification_uri}
                          target="_blank"
                          class="text-primary hover:text-primary/80 text-sm underline transition-colors"
                        >
                          Open twitch.tv/activate
                        </a>
                      </div>
                    )}
                  </Show>
                  <button
                    onClick={cancel}
                    class="text-text-muted hover:text-text text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div class="text-center flex flex-col gap-1">
                    <h2 class="text-text text-xl font-semibold">Welcome back</h2>
                    <p class="text-text-muted text-sm">Connect your Twitch account to get started</p>
                  </div>
                  <button
                    onClick={login}
                    class="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/85 active:bg-primary/70 transition-colors duration-150 text-text font-semibold py-3 px-6 rounded-lg cursor-pointer"
                  >
                    <TwitchIcon class="w-5 h-5 fill-text" />
                    Login with Twitch
                  </button>
                  <p class="text-text-muted text-xs text-center">
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
        <div class="flex flex-1 min-h-0 bg-bg-dark overflow-hidden">
          <Menu
            onSelect={handleChannelSelect}
            selectedId={selectedChannel()?.user_id ?? null}
            onLiveChange={setLiveChannels}
          />

          <main class="flex-1 overflow-hidden flex flex-col">
            <Show
              when={selectedChannel()}
              fallback={
                <div class="flex items-center justify-center flex-1">
                  <p class="text-text-muted text-sm">Select a channel to view chat</p>
                </div>
              }
            >
              {(ch) => (
                <Feed
                  broadcasterId={ch().user_id}
                  broadcasterLogin={ch().user_login}
                  userLogin={u().login}
                  onJumpToMessage={jumpToMessage}
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
