import { createSignal } from "solid-js";
import type { UserRef } from "../../lib/types/index.ts";
import * as channels from "../channels/index.ts";
import { hasPermission } from "../../lib/stores/roles.ts";
import {
  getChannelModerators,
  getChannelVips,
  getChatters,
} from "../../platform/twitch/chatters.ts";
import {
  addChannelModerator,
  addChannelVip,
  removeChannelModerator,
  removeChannelVip,
} from "../../platform/twitch/channels.ts";

export type ChatterList = {
  chatters: UserRef[];
  total: number;
  cursor: string | null;
  moderators: UserRef[];
  vips: UserRef[];
};

const EMPTY: ChatterList = {
  chatters: [],
  total: 0,
  cursor: null,
  moderators: [],
  vips: [],
};

const [byChannel, setByChannel] = createSignal<Record<string, ChatterList>>({});

export function listFor(broadcasterId: string): ChatterList {
  return byChannel()[broadcasterId] ?? EMPTY;
}

function update(broadcasterId: string, change: Partial<ChatterList>) {
  setByChannel((prev) => ({
    ...prev,
    [broadcasterId]: { ...(prev[broadcasterId] ?? EMPTY), ...change },
  }));
}

function clear(broadcasterId: string) {
  setByChannel((prev) => {
    const { [broadcasterId]: _, ...rest } = prev;
    return rest;
  });
}

export function start(): () => void {
  return channels.onChannel({ leave: clear });
}

export type Role = "moderator" | "vip";

const silent = { silent: true };
const loadingMore = new Set<string>();

const ids = (list: { id: string }[]) => list.map((u) => u.id);

export function load(broadcasterId: string): void {
  getChatters({ broadcasterId, cursor: null }, silent)
    .then((page) =>
      update(broadcasterId, {
        chatters: page.chatters,
        total: page.total,
        cursor: page.cursor,
      }),
    )
    .catch(() => {});
  if (hasPermission(broadcasterId, "manageRoles")) loadRoles(broadcasterId);
}

export function loadRoles(broadcasterId: string): void {
  const params = { broadcasterId };
  getChannelModerators(params, silent)
    .then((moderators) => update(broadcasterId, { moderators }))
    .catch(() => {});
  getChannelVips(params, silent)
    .then((vips) => update(broadcasterId, { vips }))
    .catch(() => {});
}

export function loadMore(broadcasterId: string): void {
  const { cursor, chatters } = listFor(broadcasterId);
  if (!cursor || loadingMore.has(broadcasterId)) return;
  loadingMore.add(broadcasterId);
  getChatters({ broadcasterId, cursor }, silent)
    .then((page) => {
      const seen = new Set(ids(chatters));
      update(broadcasterId, {
        chatters: [
          ...chatters,
          ...page.chatters.filter((c) => !seen.has(c.id)),
        ],
        total: page.total,
        cursor: page.cursor,
      });
    })
    .catch(() => {})
    .finally(() => loadingMore.delete(broadcasterId));
}

const ROLE_CALLS = {
  moderator: { add: addChannelModerator, remove: removeChannelModerator },
  vip: { add: addChannelVip, remove: removeChannelVip },
} satisfies Record<Role, unknown>;

export async function setRole(
  broadcasterId: string,
  userId: string,
  current: Role | null,
  next: Role | null,
): Promise<void> {
  const params = { broadcasterId, userId };
  try {
    if (current) await ROLE_CALLS[current].remove(params);
    if (next) await ROLE_CALLS[next].add(params);
  } finally {
    loadRoles(broadcasterId);
  }
}
