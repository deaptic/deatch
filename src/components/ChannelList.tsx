import { createMemo, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import ChannelListPinned from "./ChannelListPinned";
import ChannelListOnline from "./ChannelListOnline";
import type { TwitchStream, TwitchUser } from "../types";

export type { TwitchStream, TwitchUser };

export type Channel = {
  user_id: string;
  user_login: string;
  user_name: string;
  profile_image_url: string;
  game_name?: string;
  viewer_count?: number;
  title?: string;
  thumbnail_url?: string;
};

type Props = {
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
};

function loadPinned(): Channel[] {
  try { return JSON.parse(localStorage.getItem("pinned_channels") ?? "[]"); }
  catch { return []; }
}

function savePinned(pins: Channel[]) {
  localStorage.setItem("pinned_channels", JSON.stringify(
    pins.map(({ user_id, user_login, user_name, profile_image_url }) =>
      ({ user_id, user_login, user_name, profile_image_url }))
  ));
}

export default function ChannelList(props: Props) {
  const [pinned, setPinned] = createStore<Channel[]>(loadPinned());
  const [liveById, setLiveById] = createSignal<Map<string, Channel>>(new Map());

  const pinnedIds = createMemo(() => new Set(pinned.map(p => p.user_id)));

  function pin(ch: Channel) {
    if (pinned.some(p => p.user_id === ch.user_id)) return;
    const updated = [...loadPinned(), ch];
    setPinned(reconcile(updated));
    savePinned(updated);
  }

  function unpin(user_id: string) {
    const updated = loadPinned().filter(p => p.user_id !== user_id);
    setPinned(reconcile(updated));
    savePinned(updated);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const updated = loadPinned();
    const [item] = updated.splice(from, 1);
    updated.splice(from < to ? to - 1 : to, 0, item);
    setPinned(reconcile(updated));
    savePinned(updated);
  }

  function handleLiveUpdate(channels: Channel[]) {
    setLiveById(new Map(channels.map(ch => [ch.user_id, ch])));
  }

  return (
    <div class="flex-1 overflow-y-auto">
      <ChannelListPinned
        pinned={pinned}
        liveById={liveById()}
        onPin={pin}
        onUnpin={unpin}
        onReorder={reorder}
        onSelect={props.onSelect}
        selectedId={props.selectedId}
      />
      <ChannelListOnline
        pinnedIds={pinnedIds()}
        onPin={pin}
        onSelect={props.onSelect}
        selectedId={props.selectedId}
        onLiveUpdate={handleLiveUpdate}
      />
    </div>
  );
}
