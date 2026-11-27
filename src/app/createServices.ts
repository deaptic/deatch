import { onCleanup, onMount } from "solid-js";
import * as log from "./log/log.ts";
import { users } from "../features/users/index.ts";
import * as login from "../features/login/index.ts";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import * as modality from "../shared/keyboard/modality.ts";
import * as updater from "../features/updater/index.ts";
import * as inbox from "../features/inbox/index.ts";
import * as clock from "../shared/clock.ts";
import { theme } from "../features/appearance/index.ts";
import * as emotes from "../features/emotes/index.ts";
import * as badges from "../features/badges/index.ts";
import * as composer from "../features/composer/index.ts";
import { view } from "../features/navigation/index.ts";
import * as activity from "../features/activity/index.ts";
import * as chatModes from "../features/chat-modes/index.ts";
import * as link from "../features/link/index.ts";
import * as feed from "../features/feed/index.ts";
import * as chat from "../features/chat/index.ts";
import * as preferences from "../features/preferences/index.ts";
import { exit } from "../features/exit/index.ts";
import * as discord from "./discord.ts";
import * as tray from "./tray.ts";
import * as windowState from "./windowBounds.ts";
import * as explore from "../features/explore/index.ts";
import * as channels from "../features/channels/index.ts";
import * as people from "../features/people/index.ts";
import * as blocks from "../features/blocks/index.ts";
import * as streamerMode from "../features/streamer-mode/index.ts";
import * as timers from "../features/timers/index.ts";
import * as widgets from "../features/widgets/index.ts";
import * as changelog from "../features/changelog/index.ts";
import { about } from "../features/about/index.ts";

export function createServices(): void {
  onMount(() => {
    const stops = [
      log.start(),
      about.start(),
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
      modality.start(),
      shortcuts.start(),
      updater.start(),
      changelog.start(),
      clock.start(),
      emotes.start(),
      badges.start(),
      composer.start(),
      exit.start(),
      discord.start(),
      tray.start(),
      windowState.start(),
      explore.start(),
      channels.start(),
      people.start(),
      blocks.start(),
      streamerMode.start(),
      timers.start(),
      widgets.start(),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
    });
  });
}
