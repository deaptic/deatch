import { onCleanup, onMount } from "solid-js";
import * as log from "../services/log.ts";
import { users } from "../../features/users/index.ts";
import * as login from "../../features/login/index.ts";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import * as updater from "../../features/updater/index.ts";
import * as inbox from "../../features/inbox/index.ts";
import * as clock from "../services/clock.ts";
import * as theme from "../services/theme.ts";
import * as emotes from "../../features/emotes/index.ts";
import * as badges from "../../features/badges/index.ts";
import * as composer from "../../features/composer/index.ts";
import * as view from "../services/view.ts";
import * as activity from "../../features/activity/index.ts";
import * as chatModes from "../../features/chat-modes/index.ts";
import * as link from "../../features/link/index.ts";
import * as feed from "../../features/feed/index.ts";
import * as chat from "../../features/chat/index.ts";
import * as preferences from "../../features/preferences/index.ts";
import * as exit from "../services/exit.ts";
import * as discord from "../services/discord.ts";
import * as windowState from "../services/windowState.ts";
import * as explore from "../../features/explore/index.ts";
import * as channels from "../../features/channels/index.ts";
import * as people from "../../features/people/index.ts";
import * as blocks from "../../features/blocks/index.ts";

export function createServices(): void {
  onMount(() => {
    const stops = [
      log.start(),
      preferences.start(),
      view.start(),
      theme.start(),
      inbox.start(),
      feed.start(),
      chat.start(),
      activity.start(),
      chatModes.start(),
      link.start(),
      users.start(),
      login.start(),
      shortcuts.start(),
      updater.start(),
      clock.start(),
      emotes.start(),
      badges.start(),
      composer.start(),
      exit.start(),
      discord.start(),
      windowState.start(),
      explore.start(),
      channels.start(),
      people.start(),
      blocks.start(),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });
}
