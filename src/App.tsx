import { createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { getAllModeratedChannels } from "./commands/moderation";
import Menu, { type Channel } from "./components/menu/Menu";
import Chat from "./components/chat/Chat";
import TitleBar from "./components/title-bar/TitleBar";
import UpdateBanner from "./components/update-banner/UpdateBanner";
import Settings from "./components/settings/Settings";
import Inbox from "./components/inbox/Inbox";
import Account from "./components/account/Account";
import {
  settingsOpen,
  setSettingsOpen,
  inboxOpen,
  setInboxOpen,
  accountOpen,
  setAccountOpen,
  openSettings,
  openInbox,
  openAccount,
} from "./state/ui";
import Login from "./components/login/Login";
import Loading from "./ui/Loading";
import {
  menuChannelPinned,
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceColors,
} from "./state/preferences";
import { connectDiscord, disconnectDiscord, updateActivity } from "./services/discord";
import { startUpdateChecker } from "./services/updater";
import { applyAppearanceColors } from "./services/appearance";
import { user, setModeratedChannels, isModOfChannel } from "./state/users";
import { authChecked } from "./state/auth";
import { sessionManager } from "./managers/SessionManager";
import { eventSubManager } from "./managers/EventSubManager";
import { CHAT_KINDS, MOD_KINDS, ALL_KINDS } from "./types/eventsub";
import { setGlobalEmotes, clearChannelThirdPartyEmotes } from "./state/emotes";
import {
  loadGlobalEmotes,
  loadThirdPartyGlobalEmotes,
  loadChannelThirdPartyEmotes,
  resetChannelThirdPartyEmoteCache,
  resetUserEmotes,
} from "./services/emotes";
import {
  selectedChannel,
  setSelectedChannel,
  channelsById,
  rememberChannel,
  loadLastChannel,
  channelsInOrder,
  liveChannels as liveChannelsSignal,
} from "./state/channels";
import {
  watchActive,
  watchConnected,
  watchedChannel,
  watchWarmedChannels,
  setWatchActive,
} from "./state/watch";
import { markMentionRead, markChannelMentionsRead } from "./state/inbox";
import { loadChannelBadges, resetChannelBadgeCache } from "./services/badges";
import { dropFeed, ensureFeed, snapshotDivider, markSeen } from "./state/feeds";
import { scrollToMessage } from "./services/feeds";
import { registerShortcuts } from "./services/shortcuts";
import "./events";
import "./App.css";

let userScopedFetched = false;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  getAllModeratedChannels().then(setModeratedChannels).catch(() => {});
  loadGlobalEmotes().then(setGlobalEmotes).catch(() => {});
}

function resetUserScopedCaches() {
  userScopedFetched = false;
  resetChannelBadgeCache();
  resetChannelThirdPartyEmoteCache();
  resetUserEmotes();
}

function App() {
  const [liveChannels, setLiveChannels] = createSignal<Channel[]>([]);
  // Gate the reconciliation effect until the live-channels fetch settles so
  // pinned ∪ live get subscribed in one batch instead of two.
  const [liveLoaded, setLiveLoaded] = createSignal(false);

  const joinedIds = new Set<string>();

  function leaveChannel(broadcasterId: string) {
    if (!joinedIds.has(broadcasterId)) return;
    joinedIds.delete(broadcasterId);
    for (const k of ALL_KINDS) void eventSubManager.unsubscribe(broadcasterId, k);
    dropFeed(broadcasterId);
  }

  function applySelection(ch: Channel) {
    const prev = selectedChannel();
    if (prev && prev.user_id !== ch.user_id) snapshotDivider(prev.user_id);
    rememberChannel(ch);
    setSelectedChannel(ch);
    ensureFeed(ch.user_id);
    markSeen(ch.user_id);
    markChannelMentionsRead(ch.user_id);
  }

  function handleChannelSelect(ch: Channel) {
    setWatchActive(false);
    applySelection(ch);
  }

  // Watch-driven channel swap. Goes through applySelection (not
  // handleChannelSelect) so watchActive isn't cleared.
  createEffect(() => {
    if (!watchActive()) return;
    const ch = watchedChannel();
    if (!ch) {
      if (selectedChannel() !== null) setSelectedChannel(null);
      return;
    }
    if (selectedChannel()?.user_id === ch.user_id) return;
    applySelection(ch);
  });

  function jumpToMessage(channelId: string, messageId: string) {
    const ch = channelsById.get(channelId);
    const needsSwitch = !!ch && selectedChannel()?.user_id !== channelId;
    if (needsSwitch) handleChannelSelect(ch);
    if (needsSwitch) setTimeout(() => scrollToMessage(messageId), 100);
    else scrollToMessage(messageId);
  }

  // Load badges + third-party emotes for the active channel.
  createEffect(() => {
    const broadcaster = selectedChannel();
    if (!broadcaster) {
      clearChannelThirdPartyEmotes();
      return;
    }
    loadChannelBadges(broadcaster.user_id);
    loadChannelThirdPartyEmotes(broadcaster.user_id, broadcaster.user_login);
  });

  // Maintain the joined set: pinned ∪ live ∪ watch-warmed ∪ {selected}.
  createEffect(() => {
    const u = user();
    if (!u) return;
    if (!liveLoaded()) return;
    const desired = new Set<string>();
    for (const id of menuChannelPinned()) desired.add(id);
    for (const ch of liveChannels()) desired.add(ch.user_id);
    for (const ch of watchWarmedChannels()) desired.add(ch.user_id);
    const sel = selectedChannel();
    if (sel) desired.add(sel.user_id);

    const newIds: string[] = [];
    for (const id of desired) {
      if (joinedIds.has(id)) continue;
      joinedIds.add(id);
      ensureFeed(id);
      newIds.push(id);
    }
    // The backend re-orders subs by KIND_PRIORITY before issuing HTTP, so
    // calling order here doesn't matter — only the set of kinds per channel.
    for (const id of newIds) {
      for (const k of CHAT_KINDS) void eventSubManager.subscribe(id, k);
      if (isModOfChannel(id)) {
        for (const k of MOD_KINDS) void eventSubManager.subscribe(id, k);
      }
    }
    for (const id of [...joinedIds]) {
      if (!desired.has(id)) leaveChannel(id);
    }
  });

  function cycleChannel(direction: 1 | -1) {
    const ordered = channelsInOrder();
    if (ordered.length === 0) return;
    const i = watchActive()
      ? -1
      : ordered.findIndex((c) => c.user_id === selectedChannel()?.user_id);
    const nextIdx =
      i === -1
        ? direction === 1
          ? 0
          : ordered.length - 1
        : (i + direction + ordered.length) % ordered.length;
    handleChannelSelect(ordered[nextIdx]);
  }

  function toggleWatch() {
    setWatchActive(!watchActive());
  }

  onMount(() => {
    sessionManager.restore();
    loadThirdPartyGlobalEmotes();
    const unregister = registerShortcuts({
      "Alt+ArrowDown": () => cycleChannel(1),
      "Alt+ArrowUp": () => cycleChannel(-1),
      "Alt+w": toggleWatch,
    });
    const stopUpdateChecker = startUpdateChecker();
    onCleanup(() => {
      unregister();
      stopUpdateChecker();
    });
  });

  createEffect(() => {
    applyAppearanceColors(appearanceColors());
  });

  createEffect(() => {
    getCurrentWindow().setAlwaysOnTop(advancedAlwaysOnTop()).catch(() => {});
  });

  createEffect(() => {
    const want = advancedAutostart();
    (async () => {
      const have = await isAutostartEnabled();
      if (have === want) return;
      await (want ? enableAutostart() : disableAutostart());
    })().catch(() => {});
  });

  let activityMode: string | null = null;
  let activityStartedAt = Math.floor(Date.now() / 1000);
  const viewerFormatter = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const clamp = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1) + "…" : s;
  const SELF_LURK_PHRASES = [
    "Talking to themselves",
    "Empty room energy",
    "Practicing the intro",
    "Solo in the chat",
    "Self-lurking",
    "Reading own chat alone",
    "Plotting the next stream",
    "Tumbleweeds rolling by",
  ];
  let selfLurkPhrase = SELF_LURK_PHRASES[0];
  createEffect(() => {
    if (!advancedDiscordRichPresence() || !user()) {
      activityMode = null;
      disconnectDiscord();
      return;
    }
    const ch = selectedChannel();
    const mode = inboxOpen()
      ? "inbox"
      : ch
        ? `ch:${ch.user_id}`
        : "browsing";
    if (mode !== activityMode) {
      activityMode = mode;
      activityStartedAt = Math.floor(Date.now() / 1000);
      selfLurkPhrase = SELF_LURK_PHRASES[Math.floor(Math.random() * SELF_LURK_PHRASES.length)];
    }
    if (mode === "inbox") {
      updateActivity({
        details: "Reading mentions",
        largeImage: "app_logo",
        largeText: "Deatch",
        startedAt: activityStartedAt,
        activityType: "watching",
      });
    } else if (ch) {
      const live = liveChannelsSignal().find((c) => c.user_id === ch.user_id);
      const isOwnChannel = ch.user_id === user()?.id;
      const stateText = live?.game_name
        ? live.viewer_count != null
          ? `${live.game_name} · ${viewerFormatter.format(live.viewer_count)} viewers`
          : live.game_name
        : isOwnChannel
          ? selfLurkPhrase
          : "Offline";
      const titleHover = live?.title
        ? clamp(live.title, 128)
        : ch.user_name || ch.user_login;
      const streamStartedAt = live?.started_at
        ? Math.floor(new Date(live.started_at).getTime() / 1000)
        : null;
      updateActivity({
        details: ch.user_name || ch.user_login,
        stateText,
        largeImage: ch.profile_image_url || "app_logo",
        largeText: titleHover,
        smallImage: "app_logo",
        smallText: "Deatch",
        startedAt: streamStartedAt ?? activityStartedAt,
        activityType: "watching",
        buttons: [{ label: "Open on Twitch", url: `https://twitch.tv/${ch.user_login}` }],
      });
    } else {
      updateActivity({
        details: "Browsing channels",
        stateText: "On Twitch",
        largeImage: "app_logo",
        largeText: "Deatch",
        startedAt: activityStartedAt,
        activityType: "watching",
      });
    }
    void connectDiscord();
  });

  createEffect(() => {
    if (user() !== null) {
      fetchUserScopedData();
      if (selectedChannel() === null && !watchActive()) {
        const last = loadLastChannel();
        if (last) handleChannelSelect(last);
      }
      return;
    }
    for (const id of [...joinedIds]) leaveChannel(id);
    resetUserScopedCaches();
    setSelectedChannel(null);
    setLiveLoaded(false);
  });

  return (
    <div class="flex flex-col h-screen bg-bg-dark relative">
      <TitleBar
        settingsOpen={settingsOpen()}
        inboxOpen={inboxOpen()}
        accountOpen={accountOpen()}
        onToggleSettings={() => (settingsOpen() ? setSettingsOpen(false) : openSettings())}
        onToggleInbox={() => (inboxOpen() ? setInboxOpen(false) : openInbox())}
        onToggleAccount={() => (accountOpen() ? setAccountOpen(false) : openAccount())}
      />
      <UpdateBanner />
      <Show when={settingsOpen()}>
        <Settings onClose={() => setSettingsOpen(false)} />
      </Show>
      <Show when={inboxOpen()}>
        <Inbox
          onClose={() => setInboxOpen(false)}
          onJump={(channelId, messageId) => {
            markMentionRead(messageId);
            jumpToMessage(channelId, messageId);
          }}
        />
      </Show>
      <Show when={accountOpen()}>
        <Account onClose={() => setAccountOpen(false)} />
      </Show>
      <Show
        when={user()}
        fallback={
          <Show
            when={authChecked()}
            fallback={
              <main class="flex-1 bg-bg-dark flex items-center justify-center">
                <Loading size={48} />
              </main>
            }
          >
            <Login />
          </Show>
        }
      >
        {(u) => (
          <div class="flex flex-1 min-h-0 bg-bg-dark overflow-hidden">
            <Menu
              onSelect={handleChannelSelect}
              selectedId={selectedChannel()?.user_id ?? null}
              onLiveChange={(data) => {
                setLiveChannels(data);
                setLiveLoaded(true);
              }}
            />

            <main class="flex-1 overflow-hidden flex flex-col">
              <Show
                when={selectedChannel()}
                fallback={
                  <div class="flex items-center justify-center flex-1 px-6">
                    <p class="text-text-muted text-sm text-center max-w-xs">
                      {(() => {
                        if (!watchActive()) return "Select a channel to view chat";
                        if (watchConnected()) {
                          return "Open a Twitch channel in your browser.";
                        }
                        const everSeen = (() => {
                          try { return localStorage.getItem("deatch_watch_seen") === "1"; }
                          catch { return false; }
                        })();
                        if (everSeen) {
                          return "Waiting for the browser. Open Firefox and a Twitch tab.";
                        }
                        return "Install the Deatch Link browser extension and open a Twitch channel to use Watch.";
                      })()}
                    </p>
                  </div>
                }
              >
                {(ch) => (
                  <Chat
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
