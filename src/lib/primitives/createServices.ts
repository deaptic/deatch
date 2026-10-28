import { onCleanup, onMount } from "solid-js";
import * as backendEvents from "../events/index.ts";
import * as log from "../services/log.ts";
import * as users from "../services/users.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as shortcuts from "../services/shortcuts.ts";
import * as updater from "../services/updater.ts";
import * as inbox from "../services/inbox.ts";
import * as clock from "../services/clock.ts";
import * as theme from "../services/theme.ts";
import * as emotes from "../services/emotes.ts";
import * as view from "../services/view.ts";
import * as channelPoints from "../services/channelPoints.ts";
import * as live from "../services/live.ts";
import * as link from "../services/link.ts";
import * as preferences from "../services/preferences.ts";
import * as feedLog from "../services/feedLog.ts";

export function createServices(): void {
  onMount(() => {
    const stops = [
      log.start(),
      preferences.start(),
      view.start(),
      theme.start(),
      inbox.start(),
      channelPoints.start(),
      backendEvents.start(),
      users.start(),
      chatActivity.start(),
      shortcuts.start(),
      updater.start(),
      clock.start(),
      emotes.start(),
      live.start(),
      feedLog.start(),
      link.start(),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });
}
