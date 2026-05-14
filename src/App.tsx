import { createSignal, createEffect, onMount, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { getAllModeratedChannels } from "./commands/moderation";
import { addToast } from "./state/toasts";
import Menu, { type Channel } from "./components/menu/Menu";
import Feed from "./components/feed/Feed";
import TitleBar from "./components/title-bar/TitleBar";
import Settings from "./components/settings/Settings";
import Inbox from "./components/inbox/Inbox";
import Login from "./components/login/Login";
import Loading from "./ui/Loading";
import {
  menuChannelPinned,
  advancedAlwaysOnTop,
  advancedAutostart,
} from "./state/preferences";
import { user, setModeratedChannels } from "./state/users";
import { authChecked } from "./state/auth";
import { sessionManager } from "./managers/SessionManager";
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
} from "./state/channels";
import { markMentionRead, markChannelMentionsRead } from "./state/inbox";
import { loadChannelBadges, resetChannelBadgeCache } from "./services/badges";
import { dropFeed, ensureFeed, snapshotDivider, markSeen } from "./state/feeds";
import { scrollToMessage } from "./services/feeds";
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
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const [inboxOpen, setInboxOpen] = createSignal(false);

  const joinedIds = new Set<string>();

  async function joinChannel(broadcasterId: string) {
    if (joinedIds.has(broadcasterId)) return;
    joinedIds.add(broadcasterId);
    ensureFeed(broadcasterId);
    try {
      await invoke("subscribe_channel", { broadcasterId });
    } catch (e) {
      joinedIds.delete(broadcasterId);
      addToast(String(e), "error");
    }
  }

  async function leaveChannel(broadcasterId: string) {
    if (!joinedIds.has(broadcasterId)) return;
    joinedIds.delete(broadcasterId);
    try {
      await invoke("unsubscribe_channel", { broadcasterId });
    } catch (e) {
      addToast(String(e), "error");
    }
    dropFeed(broadcasterId);
  }

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
    sessionManager.restore();
    loadThirdPartyGlobalEmotes();
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
    if (user() !== null) {
      fetchUserScopedData();
      if (selectedChannel() === null) {
        const last = loadLastChannel();
        if (last) handleChannelSelect(last);
      }
      return;
    }
    for (const id of [...joinedIds]) leaveChannel(id);
    resetUserScopedCaches();
    setSelectedChannel(null);
  });

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
