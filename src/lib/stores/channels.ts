import { createSignal } from "solid-js";
import type { Stream } from "../types/twitch/stream.ts";
import type { User, UserRef } from "../types/twitch/user.ts";
import { menuChannelPinned } from "./preferences.ts";
import { watchWarmedChannels } from "./watch.ts";

export const [liveStreams, setLiveStreams] = createSignal<Stream[]>([]);

export const usersById = new Map<string, User>();

const [usersVersion, setUsersVersion] = createSignal(0);

const MAX_REMEMBERED_USERS = 5000;

export function rememberUser(u: User) {
  usersById.set(u.id, u);
  while (usersById.size > MAX_REMEMBERED_USERS) {
    const oldest = usersById.keys().next().value;
    if (oldest === undefined) break;
    usersById.delete(oldest);
  }
  setUsersVersion((v) => v + 1);
}

export function streamForUserId(userId: string): Stream | undefined {
  return liveStreams().find((s) => s.user.id === userId);
}

export function channelsInOrder(): User[] {
  const pinnedIds = menuChannelPinned();
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
    push(usersById.get(id) ?? userFromStream(live, id));
  }
  for (const s of live) {
    if (pinnedSet.has(s.user.id)) continue;
    push(usersById.get(s.user.id) ?? userFromRef(s.user));
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
    broadcasterType: "",
    createdAt: "",
  };
}

export function resolveUser(ref: UserRef): User {
  usersVersion();
  return usersById.get(ref.id) ?? userFromRef(ref);
}
