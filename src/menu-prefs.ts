import { createSignal } from "solid-js";
import { loadUserPreferences, saveUserPreferences, type PinnedChannel } from "./preferences";

const initial = loadUserPreferences();
const [pinnedChannels, setPinnedChannelsSignal] = createSignal<PinnedChannel[]>(initial.menu.channels.pinned);

export { pinnedChannels };

export function setPinnedChannels(value: PinnedChannel[]) {
  const stripped = value.map(({ user_id, user_login, user_name, profile_image_url }) =>
    ({ user_id, user_login, user_name, profile_image_url }),
  );
  const prefs = loadUserPreferences();
  saveUserPreferences({
    ...prefs,
    menu: { ...prefs.menu, channels: { ...prefs.menu.channels, pinned: stripped } },
  });
  setPinnedChannelsSignal(stripped);
}
