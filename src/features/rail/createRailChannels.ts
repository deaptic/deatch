import { createMemo } from "solid-js";
import { followedLive, pinsLoaded } from "../channels/index.ts";
import { knownUser } from "../users/index.ts";
import {
  pinnedChannels,
  systemFollowedChannels,
} from "../preferences/index.ts";
import * as link from "../link/index.ts";
import { isOwnChannel } from "../permissions/index.ts";
import type { User } from "../../shared/types/index.ts";

type RailChannels = {
  loadingPinned: () => boolean;
  loadingLive: () => boolean;
  onlineList: () => User[];
  followedLiveCount: () => number;
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
  const followedUnlisted = createMemo(() =>
    live().filter((ch) => !pinnedIds().has(ch.id) && !isTab(ch.id)),
  );
  const onlineList = () => (systemFollowedChannels() ? followedUnlisted() : []);
  return {
    loadingPinned: () => !pinsLoaded(),
    loadingLive: () => followedLive() === null,
    onlineList,
    followedLiveCount: () => followedUnlisted().length,
    resolveChannel: (id) => liveById().get(id) ?? knownUser(id),
    isLive,
    isTab,
    isListed: (id) =>
      pinnedIds().has(id) ||
      isTab(id) ||
      link.activeTab()?.id === id ||
      (systemFollowedChannels() && isLive(id)) ||
      isOwnChannel(id),
  };
}
