import { createSignal } from "solid-js";
import type { ChannelInfo } from "../types/index.ts";
import type { Stream } from "../types/index.ts";
import type { User, UserRef } from "../types/index.ts";
import { pinnedChannels } from "./preferences.ts";
import { watchWarmedChannels } from "./watch.ts";
import { knownUser } from "./users.ts";

export const [liveStreams, setLiveStreams] = createSignal<Stream[]>([]);

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

export function applyChannelInfo(info: ChannelInfo) {
  rememberChannelInfo([info]);
  setLiveStreams((streams) =>
    streams.map((s) =>
      s.user.id === info.broadcaster.id
        ? { ...s, title: info.title, game: info.game }
        : s
    )
  );
}

export function channelInfoFor(userId: string): ChannelInfo | undefined {
  return channelInfoById()[userId];
}

export function streamForUserId(userId: string): Stream | undefined {
  return liveStreams().find((s) => s.user.id === userId);
}

export function channelsInOrder(): User[] {
  const pinnedIds = pinnedChannels();
  const pinnedSet = new Set(pinnedIds);
  const warmedSet = new Set(watchWarmedChannels().map((c) => c?.id));
  const live = liveStreams();
  const ordered: User[] = [];
  const seen = new Set<string>();
  const push = (u: User | undefined) => {
    if (u && !seen.has(u.id) && !warmedSet.has(u.id)) {
      seen.add(u.id);
      ordered.push(u);
    }
  };
  for (const id of pinnedIds) {
    push(knownUser(id) ?? userFromStream(live, id));
  }
  for (const s of live) {
    if (pinnedSet.has(s.user.id)) continue;
    push(knownUser(s.user.id) ?? userFromRef(s.user));
  }
  return ordered;
}

function userFromStream(streams: Stream[], userId: string): User | undefined {
  const s = streams.find((x) => x.user.id === userId);
  return s ? userFromRef(s.user) : undefined;
}

export function userFromRef(ref: UserRef): User {
  return {
    id: ref.id,
    login: ref.login,
    displayName: ref.displayName,
    profileImageUrl: "",
    description: "",
    broadcasterType: "normal",
    createdAt: "",
  };
}

export function resolveUser(ref: UserRef): User {
  return knownUser(ref.id) ?? userFromRef(ref);
}
