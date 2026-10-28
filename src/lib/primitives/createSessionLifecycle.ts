import { createEffect, onMount } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import { setGlobalEmotes } from "../stores/emotes.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
import * as session from "../services/session.ts";
import { resetView } from "../stores/view.ts";
import { createBackoff } from "../utils/backoff.ts";

const RETRY_MIN_MS = 30_000;
const RETRY_MAX_MS = 300_000;

const retry = createBackoff(RETRY_MIN_MS, RETRY_MAX_MS);

let userScopedFetched = false;

function fetchUserScopedData() {
  if (userScopedFetched) return;
  userScopedFetched = true;
  emotes
    .loadGlobal()
    .then((list) => {
      retry.succeeded();
      setGlobalEmotes(list);
    })
    .catch(() => {
      userScopedFetched = false;
      if (user() === null) return;
      retry.schedule(fetchUserScopedData);
    });
}

function resetUserScopedCaches() {
  retry.reset();
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
    void session.restore();
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
