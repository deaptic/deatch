import { createSignal } from "solid-js";
import type {
  ChannelInfo,
  Stream,
  User,
  UserRef,
} from "../../shared/types/index.ts";
import { pinnedChannels } from "../preferences/index.ts";
import * as link from "../link/index.ts";
import { knownUser } from "../users/index.ts";
import { orderChannels } from "./order.ts";
import { userFromRef } from "../../shared/user.ts";

export const [liveStreams, setLiveStreams] = createSignal<Stream[]>([]);

export const [followedLive, setFollowedLive] = createSignal<User[] | null>(
  null,
);
export const [pinsLoaded, setPinsLoaded] = createSignal(false);

const [channelInfoById, setChannelInfoById] = createSignal<
  Record<string, ChannelInfo>
>({});

export function rememberChannelInfo(infos: ChannelInfo[]) {
  setChannelInfoById((prev) => {
    const next = { ...prev };
    for (const c of infos) next[c.broadcaster.id] = c;
    return next;
  });
}

export function forgetChannelInfo(broadcasterId: string) {
  setChannelInfoById((prev) => {
    if (!(broadcasterId in prev)) return prev;
    const next = { ...prev };
    delete next[broadcasterId];
    return next;
  });
}

export function applyChannelInfo(info: ChannelInfo) {
  rememberChannelInfo([info]);
  setLiveStreams((streams) =>
    streams.map((s) =>
      s.user.id === info.broadcaster.id
        ? { ...s, title: info.title, game: info.game }
        : s,
    ),
  );
}

export function channelInfoFor(userId: string): ChannelInfo | undefined {
  return channelInfoById()[userId];
}

export function streamForUserId(userId: string): Stream | undefined {
  return liveStreams().find((s) => s.user.id === userId);
}

export function channelsInOrder(): User[] {
  return orderChannels({
    pinnedIds: pinnedChannels(),
    tabIds: new Set(link.tabs().map((c) => c.id)),
    streams: liveStreams(),
    knownUser,
  });
}

export function resolveUser(ref: UserRef): User {
  return knownUser(ref.id) ?? userFromRef(ref);
}
