import { createEffect, on } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
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
  createEffect(
    on(user, (signedIn, previous) => {
      if (signedIn) {
        emotes.ensureGlobalLoaded();
        return;
      }
      if (!previous) return;
      deps.leaveAll();
      resetUserScopedCaches();
      resetView();
    }),
  );
}
