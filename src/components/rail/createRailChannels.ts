import { createMemo } from "solid-js";
import { followedLive, pinsLoaded } from "../../lib/stores/channels.ts";
import { knownUser } from "../../lib/stores/users.ts";
import { pinnedChannels } from "../../lib/stores/preferences.ts";
import { linkWarmedChannels } from "../../lib/stores/link.ts";
import type { User } from "../../lib/types/index.ts";

type RailChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
};

/// What the rail shows of the live service's state.
export function createRailChannels(): RailChannels {
  const live = () => followedLive() ?? [];
  const liveById = createMemo(() => new Map(live().map((ch) => [ch.id, ch])));
  const pinnedIdSet = createMemo(() => new Set(pinnedChannels()));
  const warmedIdSet = createMemo(
    () => new Set(linkWarmedChannels().map((ch) => ch.id)),
  );
  const onlineList = createMemo(() =>
    live().filter(
      (ch) => !pinnedIdSet().has(ch.id) && !warmedIdSet().has(ch.id),
    ),
  );
  return {
    loadingPinned: () => !pinsLoaded(),
    loadingLive: () => followedLive() === null,
    onlineList,
    resolveChannel: (id) => liveById().get(id) ?? knownUser(id),
    isLive: (id) => liveById().has(id),
  };
}
