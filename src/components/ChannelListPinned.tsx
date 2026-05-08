import { createSignal, For, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "../notifications";
import { Channel, TwitchUser } from "./ChannelList";
import ChannelListItem from "./ChannelListItem";
import ChannelListSection from "./ChannelListSection";

type Props = {
  pinned: Channel[];
  liveById: Map<string, Channel>;
  onPin: (ch: Channel) => void;
  onUnpin: (user_id: string) => void;
  onReorder: (from: number, to: number) => void;
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
};

export default function ChannelListPinned(props: Props) {
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [overIndex, setOverIndex] = createSignal<number | null>(null);
  const [adding, setAdding] = createSignal(false);
  const [addInput, setAddInput] = createSignal("");
  const [addLoading, setAddLoading] = createSignal(false);

  function startDrag(e: MouseEvent, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragIndex(idx);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-pinned-index]") as HTMLElement | null;
      const i = row ? parseInt(row.dataset.pinnedIndex!) : null;
      setOverIndex(i !== null && !isNaN(i) ? i : null);
    };

    const onUp = () => {
      const over = overIndex();
      if (over !== null && over !== idx) props.onReorder(idx, over);
      setDragIndex(null);
      setOverIndex(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  async function addChannel() {
    const login = addInput().trim().toLowerCase();
    if (!login) return;
    if (props.pinned.some(p => p.user_login === login)) {
      toast("Already pinned", "error");
      setAdding(false);
      setAddInput("");
      return;
    }
    setAddLoading(true);
    try {
      const users = await invoke<TwitchUser[]>("get_users_by_login", { logins: [login] });
      const u = users[0];
      if (!u) throw new Error("User not found");
      const ch: Channel = {
        user_id: u.id,
        user_login: u.login,
        user_name: u.display_name,
        profile_image_url: u.profile_image_url ?? "",
      };
      props.onPin(ch);
      setAdding(false);
      setAddInput("");
    } catch (e) {
      toast(String(e), "error");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <ChannelListSection
      title="Pinned"
      count={props.pinned.length}
      class="border-b border-[#2d2d35]"
      action={
        <button onClick={() => setAdding(true)} class="text-[#5c5c7a] hover:text-white transition-colors cursor-pointer" title="Add channel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </button>
      }
    >
      <Show when={adding()}>
        <div class="px-4 pb-2 flex gap-2 items-center">
          <input
            ref={(el) => el.focus()}
            type="text"
            placeholder="channel name"
            value={addInput()}
            onInput={(e) => setAddInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addChannel();
              if (e.key === "Escape") { setAdding(false); setAddInput(""); }
            }}
            class="flex-1 bg-[#2d2d35] text-white text-xs rounded px-2 py-1.5 outline-none border border-[#3d3d4a] focus:border-[#9146ff] min-w-0"
          />
          <Show when={!addLoading()} fallback={<div class="w-4 h-4 rounded-full border-2 border-[#2d2d35] border-t-[#9146ff] animate-spin shrink-0" />}>
            <button onClick={addChannel} class="text-[#9146ff] hover:text-white transition-colors cursor-pointer shrink-0" title="Add">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            </button>
          </Show>
        </div>
      </Show>

      <Show when={props.pinned.length > 0} fallback={<Show when={!adding()}><p class="text-[#5c5c7a] text-xs text-center px-4 pb-3">No pinned channels</p></Show>}>
        <For each={props.pinned}>
          {(p, index) => {
            const ch = () => props.liveById.get(p.user_id) ?? p;
            const isOver = () => overIndex() === index() && dragIndex() !== index();
            return (
              <div
                data-pinned-index={index()}
                class={`group relative border-t-2 transition-colors ${isOver() ? "border-[#9146ff]" : "border-transparent"}`}
                style={{ opacity: dragIndex() === index() ? 0.4 : 1 }}
                onMouseDown={(e) => startDrag(e, index())}
              >
                <ChannelListItem
                  avatar={ch().profile_image_url}
                  channel={ch().user_name}
                  game={ch().game_name ?? "Offline"}
                  viewerCount={ch().viewer_count}
                  isLive={props.liveById.has(p.user_id)}
                  isSelected={props.selectedId === p.user_id}
                  onClick={() => props.onSelect(ch())}
                />
                <button onClick={() => props.onUnpin(p.user_id)} class="absolute right-2 top-1/2 -translate-y-1/2 text-[#5c5c7a] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1" title="Unpin">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                  </svg>
                </button>
              </div>
            );
          }}
        </For>
      </Show>
    </ChannelListSection>
  );
}
