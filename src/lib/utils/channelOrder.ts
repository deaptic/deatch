import type { Stream, User } from "../types/index.ts";
import { userFromRef } from "./knownUsers.ts";

type Sources = {
  pinnedIds: readonly string[];
  /// Channels with a browser tab are listed apart, so they are left out.
  tabIds: ReadonlySet<string>;
  streams: readonly Pick<Stream, "user">[];
  knownUser: (id: string) => User | undefined;
};

/// The rail's order: pinned channels first, then live ones, each once. A
/// pinned channel nobody has looked up yet shows only if it is live.
export function orderChannels(sources: Sources): User[] {
  const { pinnedIds, tabIds, streams, knownUser } = sources;
  const live = new Map(streams.map((s) => [s.user.id, s]));
  const userOf = (id: string) => {
    const stream = live.get(id);
    return knownUser(id) ?? (stream ? userFromRef(stream.user) : undefined);
  };
  const ordered: User[] = [];
  const seen = new Set<string>();
  const pinned = new Set(pinnedIds);
  const ids = [
    ...pinnedIds,
    ...[...live.keys()].filter((id) => !pinned.has(id)),
  ];
  for (const id of ids) {
    const user = userOf(id);
    if (!user || seen.has(id) || tabIds.has(id)) continue;
    seen.add(id);
    ordered.push(user);
  }
  return ordered;
}
