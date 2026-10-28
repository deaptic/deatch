import { createEffect, onMount } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
import * as session from "../services/session.ts";
import * as feedLog from "../services/feedLog.ts";
import { resetView } from "../stores/view.ts";

function resetUserScopedCaches() {
  setModeratedChannels([]);
  badges.resetChannelCache();
  emotes.resetChannelThirdParty();
  emotes.resetUser();
  feedLog.discard();
}

type SessionDeps = {
  leaveAll(): void;
};

export function createSessionLifecycle(deps: SessionDeps): void {
  onMount(() => {
    void session.restore();
  });

  createEffect(() => {
    if (user() !== null) {
      emotes.ensureGlobalLoaded();
      return;
    }
    deps.leaveAll();
    resetUserScopedCaches();
    resetView();
  });
}
