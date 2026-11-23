export type ChannelRef = { id: string; login: string };

export function channelResource<T>(
  fetch: (channel: ChannelRef) => Promise<T>,
  isCurrent: (channelId: string) => boolean,
) {
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
        if (isCurrent(channel.id)) apply(value);
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
