import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "../notifications";
import { Channel, TwitchStream, TwitchUser } from "./ChannelList";
import ChannelListItem from "./ChannelListItem";
import ChannelListSection from "./ChannelListSection";

type Props = {
  pinnedIds: Set<string>;
  onPin: (ch: Channel) => void;
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onLiveUpdate: (channels: Channel[]) => void;
  collapsed?: boolean;
};

export default function ChannelListOnline(props: Props) {
  const [live, setLive] = createStore<Channel[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [fetching, setFetching] = createSignal(false);

  const unpinned = () => live.filter(ch => !props.pinnedIds.has(ch.user_id));

  async function fetchChannels() {
    setFetching(true);
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
      setFetching(false);
    }
  }

  onMount(() => {
    fetchChannels();
    const id = setInterval(fetchChannels, 60_000);
    onCleanup(() => clearInterval(id));
  });

  return (
    <ChannelListSection
      title="Live"
      count={unpinned().length}
      class=""
      sidebarCollapsed={props.collapsed}
      action={
        <button onClick={fetchChannels} class="text-[#5c5c7a] hover:text-white transition-colors cursor-pointer" title="Refresh">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class={`w-4 h-4 ${fetching() ? "animate-spin" : ""}`}>
            <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clip-rule="evenodd" />
          </svg>
        </button>
      }
    >
      <div class="py-2">
        <Show when={!loading()} fallback={
          props.collapsed ? (
            <div class="flex flex-col gap-2 items-center">
              {Array.from({ length: 4 }).map(() => (
                <div class="w-8 h-8 rounded-lg bg-[#2d2d35] animate-pulse" />
              ))}
            </div>
          ) : (
            <>{Array.from({ length: 4 }).map(() => (
              <div class="flex items-center gap-3 px-4 py-2">
                <div class="w-8 h-8 rounded-full bg-[#2d2d35] animate-pulse shrink-0" />
                <div class="flex-1 flex flex-col gap-1.5">
                  <div class="h-2.5 bg-[#2d2d35] rounded animate-pulse w-3/4" />
                  <div class="h-2 bg-[#2d2d35] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}</>
          )
        }>
          <Show when={unpinned().length > 0} fallback={<Show when={!props.collapsed}><p class="text-[#5c5c7a] text-xs text-center px-4 py-6">No channels live right now</p></Show>}>
            <For each={unpinned()}>
              {(ch) => (
                <div class="group relative">
                  <ChannelListItem
                    avatar={ch.profile_image_url}
                    channel={ch.user_name}
                    game={ch.game_name ?? ""}
                    viewerCount={ch.viewer_count}
                    isLive={true}
                    isSelected={props.selectedId === ch.user_id}
                    collapsed={props.collapsed}
                    onClick={() => props.onSelect(ch)}
                  />
                  <button onClick={() => props.onPin(ch)} class={`absolute right-2 top-1/2 -translate-y-1/2 text-[#5c5c7a] hover:text-[#9146ff] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 ${props.collapsed ? "hidden" : ""}`} title="Pin">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
                      <path d="M9.828.722a.5.5 0 01.354.146l4.95 4.95a.5.5 0 010 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 01.16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 01-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 010-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 011.013.16l3.134-3.133a2.772 2.772 0 01-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 01.353-.146z" />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </ChannelListSection>
  );
}
