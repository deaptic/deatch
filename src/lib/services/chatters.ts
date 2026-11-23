import {
  getChannelModerators,
  getChannelVips,
  getChatters,
} from "../api/twitch/chatters.ts";
import { chatterListFor, updateChatterList } from "../stores/chatters.ts";

const silent = { silent: true };
const loadingMore = new Set<string>();

const ids = (users: { id: string }[]) => users.map((u) => u.id);

export function load(broadcasterId: string): void {
  const params = { broadcasterId };
  getChatters({ broadcasterId, cursor: null }, silent)
    .then((page) =>
      updateChatterList(broadcasterId, {
        chatters: page.chatters,
        total: page.total,
        cursor: page.cursor,
      }),
    )
    .catch(() => {});
  getChannelModerators(params, silent)
    .then((mods) => updateChatterList(broadcasterId, { moderators: ids(mods) }))
    .catch(() => {});
  getChannelVips(params, silent)
    .then((vips) => updateChatterList(broadcasterId, { vips: ids(vips) }))
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
