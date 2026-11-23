import { createMemo } from "solid-js";
import { followedLive, pinsLoaded } from "../channels/index.ts";
import { knownUser } from "../users/index.ts";
import { pinnedChannels } from "../preferences/index.ts";
import * as link from "../link/index.ts";
import type { User } from "../../lib/types/index.ts";

type RailChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
};

export function createRailChannels(): RailChannels {
  const live = () => followedLive() ?? [];
  const liveById = createMemo(() => new Map(live().map((ch) => [ch.id, ch])));
  const pinnedIdSet = createMemo(() => new Set(pinnedChannels()));
  const warmedIdSet = createMemo(() => new Set(link.tabs().map((ch) => ch.id)));
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
