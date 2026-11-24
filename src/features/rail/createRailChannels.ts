import { createMemo } from "solid-js";
import { followedLive, pinsLoaded } from "../channels/index.ts";
import { knownUser } from "../users/index.ts";
import { pinnedChannels } from "../preferences/index.ts";
import * as link from "../link/index.ts";
import { isOwnChannel } from "../permissions/index.ts";
import type { User } from "../../shared/types/index.ts";

type RailChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
  isTab: (id: string) => boolean;
  isListed: (id: string) => boolean;
};

export function createRailChannels(): RailChannels {
  const live = () => followedLive() ?? [];
  const liveById = createMemo(() => new Map(live().map((ch) => [ch.id, ch])));
  const pinnedIds = createMemo(() => new Set(pinnedChannels()));
  const tabIds = createMemo(() => new Set(link.tabs().map((ch) => ch.id)));
  const isTab = (id: string) => tabIds().has(id);
  const isLive = (id: string) => liveById().has(id);
  const onlineList = createMemo(() =>
    live().filter((ch) => !pinnedIds().has(ch.id) && !isTab(ch.id)),
  );
  return {
    loadingPinned: () => !pinsLoaded(),
    loadingLive: () => followedLive() === null,
    onlineList,
    resolveChannel: (id) => liveById().get(id) ?? knownUser(id),
    isLive,
    isTab,
    isListed: (id) =>
      pinnedIds().has(id) ||
      isTab(id) ||
      link.activeTab()?.id === id ||
      isLive(id) ||
      isOwnChannel(id),
  };
}
