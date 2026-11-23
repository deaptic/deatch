import { createEffect, on } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import * as emotes from "../services/emotes.ts";
import * as badges from "../services/badges.ts";
import * as feedLog from "../services/feedLog.ts";
import { resetView } from "../stores/view.ts";
import { getModeratedChannels } from "../api/twitch/moderation.ts";

function resetUserScopedCaches() {
  setModeratedChannels([]);
  badges.resetChannelCache();
  emotes.resetChannels();
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
        getModeratedChannels({ silent: true })
          .then((channels) => {
            if (user()?.id === signedIn.id) setModeratedChannels(channels);
          })
          .catch(() => {});
        return;
      }
      if (!previous) return;
      deps.leaveAll();
      resetUserScopedCaches();
      resetView();
    }),
  );
}
