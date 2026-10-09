import { onCleanup, onMount } from "solid-js";
import * as backendEvents from "../events/index.ts";
import * as log from "../services/log.ts";
import * as users from "../services/users.ts";
import * as chatActivity from "../services/chatActivity.ts";
import * as sevenTv from "../services/sevenTv.ts";
import * as shortcuts from "../services/shortcuts.ts";
import * as updater from "../services/updater.ts";
import * as inbox from "../services/inbox.ts";
import * as clock from "../services/clock.ts";

export function createServices(): void {
  onMount(() => {
    const stops = [
      log.start(),
      backendEvents.start(),
      users.start(),
      chatActivity.start(),
      sevenTv.start(),
      shortcuts.start(),
      updater.start(),
      inbox.start(),
      clock.start(),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });
}
