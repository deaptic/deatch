import { createEffect, on } from "solid-js";
import { setModeratedChannels, user } from "../stores/users.ts";
import * as emotes from "../../features/emotes/index.ts";
import * as badges from "../../features/badges/index.ts";
import { feedLog } from "../../features/feed/index.ts";
import { resetView } from "../stores/view.ts";
import * as channels from "../../features/channels/index.ts";
import { getModeratedChannels } from "../../platform/twitch/moderation.ts";

function resetUserScopedCaches() {
  setModeratedChannels([]);
  badges.resetChannelCache();
  emotes.resetChannels();
  emotes.resetUser();
  feedLog.discard();
}

export function createSessionLifecycle(): void {
  createEffect(
    on(user, (signedIn, previous) => {
      if (signedIn) {
        emotes.ensureGlobalLoaded();
        getModeratedChannels({ silent: true })
          .then((moderated) => {
            if (user()?.id === signedIn.id) setModeratedChannels(moderated);
          })
          .catch(() => {});
        return;
      }
      if (!previous) return;
      channels.leaveAll();
      resetUserScopedCaches();
      resetView();
    }),
  );
}
