import { channelFromUrl } from "../shared/channel.ts";

type TabInfo = Pick<
  chrome.tabs.Tab,
  "id" | "url" | "incognito" | "lastAccessed" | "mutedInfo"
>;
type LinkChannel = { login: string; muted: boolean };
export type TabSummary = { channels: LinkChannel[]; current: string | null };
export type Tabs = ReturnType<typeof createTabs>;

export function createTabs() {
  const channels = new Map<number, string>();
  const muted = new Map<number, boolean>();
  const focusedAt = new Map<number, number>();
  let active: number | null = null;

  function forget(id: number) {
    channels.delete(id);
    muted.delete(id);
    focusedAt.delete(id);
  }

  function apply(tab: TabInfo) {
    const { id } = tab;
    if (id == null) return;
    const channel = channelFromUrl(tab.url ?? "");
    if (!channel || tab.incognito) return forget(id);
    if (!focusedAt.has(id)) focusedAt.set(id, tab.lastAccessed);
    if (tab.mutedInfo) muted.set(id, tab.mutedInfo.muted);
    channels.set(id, channel);
  }

  function touch(id: number, at: number) {
    if (channels.has(id)) focusedAt.set(id, at);
  }

  function remove(id: number) {
    forget(id);
    if (id === active) active = null;
  }

  function replace(added: number, removed: number) {
    forget(removed);
    if (removed === active) active = added;
  }

  const byRecent = (ids: number[]) =>
    ids.sort((a, b) => (focusedAt.get(b) ?? 0) - (focusedAt.get(a) ?? 0));

  function tabsOf(channel: string): number[] {
    return [...channels].filter(([, ch]) => ch === channel).map(([id]) => id);
  }

  function summary(): TabSummary {
    const byChannel = new Map<string, boolean>();
    for (const [id, channel] of channels) {
      const isMuted = muted.get(id) === true;
      byChannel.set(channel, (byChannel.get(channel) ?? true) && isMuted);
    }
    const list = [...byChannel]
      .map(([login, isMuted]) => ({ login, muted: isMuted }))
      .sort((a, b) => a.login.localeCompare(b.login));
    const [recent] = byRecent([...channels.keys()]);
    const current =
      (active !== null ? channels.get(active) : undefined) ??
      (recent !== undefined ? channels.get(recent) : undefined) ??
      null;
    return { channels: list, current };
  }

  return {
    apply,
    touch,
    remove,
    replace,
    tabsOf,
    summary,
    setActive: (id: number | null) => {
      active = id;
    },
    isActive: (id: number) => id === active,
    latestTabOf: (channel: string): number | undefined =>
      byRecent(tabsOf(channel))[0],
  };
}
