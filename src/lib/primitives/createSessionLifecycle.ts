import { createEffect, onMount } from "solid-js";
import { getModeratedChannels } from "../api/twitch/moderation.ts";
import { fetchAllPages } from "../api/utils.ts";
import type { UserRef } from "../types/twitch/user.ts";
import { setModeratedChannels, user } from "../stores/users.ts";
import { setGlobalEmotes } from "../stores/emotes.ts";
import {
  loadGlobalEmotes,
  loadThirdPartyGlobalEmotes,
  resetChannelThirdPartyEmoteCache,
  resetUserEmotes,
} from "../services/emotes.ts";
import { resetChannelBadgeCache } from "../services/badges.ts";
import { sessionManager } from "../managers/SessionManager.ts";
import { showExplore } from "../stores/view.ts";

let userScopedFetched = false;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  fetchAllPages<UserRef>(
    "get_moderated_channels",
    (after, opts) => getModeratedChannels({ after }, opts),
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
  setLiveLoaded: (loaded: boolean) => void;
  leaveAll(): void;
};

export function createSessionLifecycle(deps: SessionDeps): void {
  onMount(() => {
    sessionManager.restore();
    loadThirdPartyGlobalEmotes();
  });

  createEffect(() => {
    if (user() !== null) {
      fetchUserScopedData();
      return;
    }
    deps.leaveAll();
    resetUserScopedCaches();
    showExplore();
    deps.setLiveLoaded(false);
  });
}
