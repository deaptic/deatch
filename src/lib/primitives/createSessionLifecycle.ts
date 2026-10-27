import { createEffect, onMount } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import { setGlobalEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
import * as session from "../services/session.ts";
import { resetView } from "../stores/view.ts";

const RETRY_MIN_MS = 30_000;
const RETRY_MAX_MS = 300_000;

let userScopedFetched = false;
let retryTimer: number | undefined;
let retryDelay = RETRY_MIN_MS;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  emotes
    .loadGlobal()
    .then((list) => {
      retryDelay = RETRY_MIN_MS;
      setGlobalEmotes(list);
    })
    .catch(() => {
      userScopedFetched = false;
      if (user() === null) return;
      retryTimer = window.setTimeout(fetchUserScopedData, retryDelay);
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
    });
}

function resetUserScopedCaches() {
  window.clearTimeout(retryTimer);
  retryTimer = undefined;
  retryDelay = RETRY_MIN_MS;
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
    resetView();
    deps.setLiveLoaded(false);
  });
}
