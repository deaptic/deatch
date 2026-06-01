import { createEffect, onMount } from "solid-js";
import { getModeratedChannels } from "../api/twitch/moderation";
import { fetchAllPages } from "../api/utils";
import type { UserRef } from "../types/twitch/user";
import { setModeratedChannels, user } from "../stores/users";
import { setGlobalEmotes } from "../stores/emotes";
import {
  loadGlobalEmotes,
  loadThirdPartyGlobalEmotes,
  resetChannelThirdPartyEmoteCache,
  resetUserEmotes,
} from "../services/emotes";
import { resetChannelBadgeCache } from "../services/badges";
import { sessionManager } from "../managers/SessionManager";
import {
  selectedChannel,
  setSelectedChannel,
  loadLastChannel,
} from "../stores/channels";
import { watchMode } from "../stores/watch";
import type { ChannelNavigation } from "./createChannelNavigation";

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

export type SessionDeps = {
  selectChannel: ChannelNavigation["selectChannel"];
  setLiveLoaded: (loaded: boolean) => void;
  leaveAll(): void;
}

export function createSessionLifecycle(deps: SessionDeps): void {
  onMount(() => {
    sessionManager.restore();
    loadThirdPartyGlobalEmotes();
  });

  createEffect(() => {
    if (user() !== null) {
      fetchUserScopedData();
      if (selectedChannel() === null && watchMode() === null) {
        const last = loadLastChannel();
        if (last) deps.selectChannel(last);
      }
      return;
    }
    deps.leaveAll();
    resetUserScopedCaches();
    setSelectedChannel(null);
    deps.setLiveLoaded(false);
  });
}
