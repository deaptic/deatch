import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "../notifications";
import { Channel, TwitchStream, TwitchUser } from "./ChannelList";
import ChannelListItem from "./ChannelListItem";

type Props = {
  pinnedIds: Set<string>;
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onLiveUpdate: (channels: Channel[]) => void;
  onContextMenu: (ch: Channel, x: number, y: number) => void;
  expose?: (api: { refresh: () => Promise<void> }) => void;
};

export default function ChannelListOnline(props: Props) {
  const [live, setLive] = createStore<Channel[]>([]);
  const [loading, setLoading] = createSignal(true);

  const unpinned = () => live.filter(ch => !props.pinnedIds.has(ch.user_id));

  async function fetchChannels() {
    try {
      const followed = await invoke<TwitchStream[]>("get_followed_streams");
      const followedIds = new Set(followed.map(s => s.user_id));

      const unpinnedPinnedIds = [...props.pinnedIds].filter(id => !followedIds.has(id));
      const pinnedStreams = unpinnedPinnedIds.length > 0
        ? await invoke<TwitchStream[]>("get_streams_by_user_id", { userIds: unpinnedPinnedIds })
        : [];

      const streams = [...followed, ...pinnedStreams];

      const profileMap = new Map<string, string>();
      if (streams.length > 0) {
        const users = await invoke<TwitchUser[]>("get_users_by_id", {
          userIds: streams.map(s => s.user_id),
        });
        for (const u of users) profileMap.set(u.id, u.profile_image_url ?? "");
      }
      const data: Channel[] = streams.map(s => ({
        user_id: s.user_id,
        user_login: s.user_login,
        user_name: s.user_name,
        game_name: s.game_name,
        title: s.title,
        viewer_count: s.viewer_count,
        thumbnail_url: s.thumbnail_url.replace("{width}", "440").replace("{height}", "248"),
        profile_image_url: profileMap.get(s.user_id) ?? "",
      }));
      setLive(reconcile(data, { key: "user_id" }));
      props.onLiveUpdate(data);
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setLoading(false);
    }
  }

  async function manualRefresh() {
    setLoading(true);
    await fetchChannels();
  }

  onMount(() => {
    fetchChannels();
    props.expose?.({ refresh: manualRefresh });
    const id = setInterval(fetchChannels, 60_000);
    onCleanup(() => clearInterval(id));
  });

  return (
    <div class="py-2">
      <Show when={!loading()} fallback={
        <>
          {Array.from({ length: 4 }).map(() => (
            <div class="w-full flex items-center justify-center p-2">
              <div class="w-8 h-8 rounded-lg bg-[#2d2d35] animate-pulse" />
            </div>
          ))}
        </>
      }>
        <For each={unpinned()}>
          {(ch) => (
            <ChannelListItem
              avatar={ch.profile_image_url}
              channel={ch.user_name}
              game={ch.game_name ?? ""}
              viewerCount={ch.viewer_count}
              isLive={true}
              isSelected={props.selectedId === ch.user_id}
              onClick={() => props.onSelect(ch)}
              onContextMenu={(x, y) => props.onContextMenu(ch, x, y)}
            />
          )}
        </For>
      </Show>
    </div>
  );
}
