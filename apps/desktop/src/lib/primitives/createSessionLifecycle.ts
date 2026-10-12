import { createEffect, onMount } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import { setGlobalEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
import * as session from "../services/session.ts";
import { showExplore } from "../stores/view.ts";

let userScopedFetched = false;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  emotes.loadGlobal().then(setGlobalEmotes).catch(() => {});
}

function resetUserScopedCaches() {
  userScopedFetched = false;
  setModeratedChannels([]);
  badges.resetChannelCache();
  emotes.resetChannelThirdParty();
  emotes.resetUser();
}

export type SessionDeps = {
  setLiveLoaded: (loaded: boolean) => void;
  leaveAll(): void;
};

export function createSessionLifecycle(deps: SessionDeps): void {
  onMount(() => {
    session.restore();
    emotes.loadThirdPartyGlobal();
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
