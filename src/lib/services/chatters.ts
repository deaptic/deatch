import {
  getChannelModerators,
  getChannelVips,
  getChatters,
} from "../api/twitch/chatters.ts";
import {
  addChannelModerator,
  addChannelVip,
  removeChannelModerator,
  removeChannelVip,
} from "../api/twitch/channels.ts";
import { chatterListFor, updateChatterList } from "../stores/chatters.ts";

export type Role = "moderator" | "vip";

const silent = { silent: true };
const loadingMore = new Set<string>();

const ids = (list: { id: string }[]) => list.map((u) => u.id);

export function load(broadcasterId: string, isOwner: boolean): void {
  getChatters({ broadcasterId, cursor: null }, silent)
    .then((page) =>
      updateChatterList(broadcasterId, {
        chatters: page.chatters,
        total: page.total,
        cursor: page.cursor,
      }),
    )
    .catch(() => {});
  if (isOwner) loadRoles(broadcasterId);
}

export function loadRoles(broadcasterId: string): void {
  const params = { broadcasterId };
  getChannelModerators(params, silent)
    .then((moderators) => updateChatterList(broadcasterId, { moderators }))
    .catch(() => {});
  getChannelVips(params, silent)
    .then((vips) => updateChatterList(broadcasterId, { vips }))
    .catch(() => {});
}

export function loadMore(broadcasterId: string): void {
  const { cursor, chatters } = chatterListFor(broadcasterId);
  if (!cursor || loadingMore.has(broadcasterId)) return;
  loadingMore.add(broadcasterId);
  getChatters({ broadcasterId, cursor }, silent)
    .then((page) => {
      const seen = new Set(ids(chatters));
      updateChatterList(broadcasterId, {
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
