import { createSignal, createEffect, on, onMount, onCleanup, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { getModeratedChannels } from "./commands/twitch/moderation";
import { fetchAllPages } from "./commands/utils";
import type { UserRef } from "./types/twitch/user";
import Menu, { type Channel } from "./components/menu/Menu";
import Chat from "./components/chat/Chat";
import Toaster from "./components/toaster/Toaster";
import { toasts, removeToast } from "./state/toasts";
import TitleBar from "./components/title-bar/TitleBar";
import UpdateBanner from "./components/update-banner/UpdateBanner";
import Settings from "./components/settings/Settings";
import Inbox from "./components/inbox/Inbox";
import Account from "./components/account/Account";
import { openPanel, setOpenPanel, isPanelOpen, togglePanel } from "./state/ui";
import Login from "./components/login/Login";
import Loading from "./ui/Loading";
import {
  menuChannelPinned,
  advancedAlwaysOnTop,
  setAdvancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceColors,
} from "./state/preferences";
import { applyDiscordPresence } from "./services/discord";
import { startUpdateChecker } from "./services/updater";
import { applyAppearanceColors } from "./services/appearance";
import { user, setModeratedChannels, isModOfChannel } from "./state/users";
import { authChecked } from "./state/auth";
import { sessionManager } from "./managers/SessionManager";
import { eventSubManager } from "./managers/EventSubManager";
import { CHAT_KINDS, MOD_KINDS, ALL_KINDS } from "./types/twitch/eventsub";
import { setGlobalEmotes, clearChannelThirdPartyEmotes } from "./state/emotes";
import {
  loadGlobalEmotes,
  loadThirdPartyGlobalEmotes,
  loadChannelThirdPartyEmotes,
  resetChannelThirdPartyEmoteCache,
  clearActiveSevenTvSubscription,
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
import { shortcutManager } from "./managers/ShortcutManager";
import "./events";
import "./App.css";

let userScopedFetched = false;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  fetchAllPages<UserRef>("get_moderated_channels", (after, opts) =>
    getModeratedChannels({ after }, opts),
  )
    .then(setModeratedChannels)
    .catch(() => {});
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

  createEffect(
    on(
      selectedChannel,
      (curr, prev) => {
        if (prev && prev.user_id !== curr?.user_id) {
          snapshotDivider(prev.user_id);
        }
      },
      { defer: true },
    ),
  );

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

  createEffect(() => {
    const broadcaster = selectedChannel();
    if (!broadcaster) {
      clearChannelThirdPartyEmotes();
      clearActiveSevenTvSubscription();
      return;
    }
    loadChannelBadges(broadcaster.user_id);
    loadChannelThirdPartyEmotes(broadcaster.user_id, broadcaster.user_login);
  });

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
    const unbindActions = [
      shortcutManager.register("channel::cycleNext", () => cycleChannel(1)),
      shortcutManager.register("channel::cyclePrev", () => cycleChannel(-1)),
      shortcutManager.register("watch::toggle", toggleWatch),
      shortcutManager.register("settings::toggle", () => togglePanel("settings")),
      shortcutManager.register("inbox::toggle", () => togglePanel("inbox")),
      shortcutManager.register("account::toggle", () => togglePanel("account")),
      shortcutManager.register("emotePicker::toggle", () => togglePanel("emotePicker")),
      shortcutManager.register("panel::close", () => {
        if (!openPanel()) return false;
        setOpenPanel(null);
      }),
      shortcutManager.register("view::toggleAlwaysOnTop", () => {
        setAdvancedAlwaysOnTop(!advancedAlwaysOnTop());
      }),
    ];
    for (let i = 1; i <= 9; i++) {
      const idx = i - 1;
      unbindActions.push(
        shortcutManager.register(`channel::select${i}`, () => {
          const ordered = channelsInOrder();
          if (idx < ordered.length) handleChannelSelect(ordered[idx]);
        }),
      );
    }
    shortcutManager.start();
    const stopUpdateChecker = startUpdateChecker();
    onCleanup(() => {
      for (const u of unbindActions) u();
      shortcutManager.stop();
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

  createEffect(() => {
    const u = user();
    applyDiscordPresence({
      enabled: advancedDiscordRichPresence(),
      authenticated: u !== null,
      userId: u?.id ?? null,
      channel: selectedChannel(),
      inboxOpen: isPanelOpen("inbox"),
      liveChannels: liveChannelsSignal(),
    });
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
        settingsOpen={isPanelOpen("settings")}
        inboxOpen={isPanelOpen("inbox")}
        accountOpen={isPanelOpen("account")}
        onToggleSettings={() => togglePanel("settings")}
        onToggleInbox={() => togglePanel("inbox")}
        onToggleAccount={() => togglePanel("account")}
      />
      <UpdateBanner />
      <div class="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <Show when={isPanelOpen("settings")}>
          <Settings onClose={() => setOpenPanel(null)} />
        </Show>
        <Show when={isPanelOpen("inbox")}>
          <Inbox
            onClose={() => setOpenPanel(null)}
            onJump={(channelId, messageId) => {
              markMentionRead(messageId);
              jumpToMessage(channelId, messageId);
            }}
          />
        </Show>
        <Show when={isPanelOpen("account")}>
          <Account onClose={() => setOpenPanel(null)} />
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
        <Toaster toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  );
}

export default App;
