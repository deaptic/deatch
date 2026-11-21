import type { User } from "../types/index.ts";
import { selectedChannel } from "../stores/view.ts";

export type ChannelRef = Pick<User, "id" | "login">;

export function channelResource<T>(fetch: (channel: ChannelRef) => Promise<T>) {
  const cache = new Map<string, Promise<T>>();

  function get(channel: ChannelRef): Promise<T> {
    let p = cache.get(channel.id);
    if (!p) {
      p = fetch(channel).catch((e) => {
        cache.delete(channel.id);
        throw e;
      });
      cache.set(channel.id, p);
    }
    return p;
  }

  function show(channel: ChannelRef, apply: (value: T) => void): void {
    get(channel)
      .then((value) => {
        if (selectedChannel()?.id === channel.id) apply(value);
      })
      .catch(() => {});
  }

  return {
    get,
    show,
    forget: (channelId: string) => cache.delete(channelId),
    clear: () => cache.clear(),
  };
}
