import { Show, For, createSignal } from "solid-js";
import Navigation from "../ui/Navigation.tsx";
import MenuSectionItem from "./MenuSectionItem.tsx";
import {
  menuChannelPinned,
  reorderPinnedChannels,
} from "../../lib/stores/preferences.ts";
import { watchMode } from "../../lib/stores/watch.ts";
import { hasUnread } from "../../lib/stores/feeds.ts";
import { channelMentionCount } from "../../lib/stores/inbox.ts";
import type { User } from "../../lib/types/twitch/user.ts";

type Props = {
  resolveChannel: (id: string) => User | undefined;
  isLive: (id: string) => boolean;
  loading: boolean;
  selectedId: string | null;
  onSelect: (ch: User) => void;
  onOpenInBrowser: (ch: User) => void;
  onContextMenu: (ch: User, x: number, y: number) => void;
}

export default function MenuPinnedList(props: Props) {
  const [dragIdx, setDragIdx] = createSignal<number | null>(null);
  const [overIdx, setOverIdx] = createSignal<number | null>(null);

  function startDrag(e: MouseEvent, idx: number) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragIdx(idx);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const row = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-pinned-index]") as HTMLElement | null;
      const i = row ? parseInt(row.dataset.pinnedIndex!) : null;
      setOverIdx(i !== null && !isNaN(i) ? i : null);
    };
    const onUp = () => {
      const over = overIdx();
      if (over !== null && over !== idx) reorderPinnedChannels(idx, over);
      setDragIdx(null);
      setOverIdx(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <Navigation
      orientation="vertical"
      scroll={false}
      indicatorClass="bg-primary rounded-r-full"
    >
      <Show
        when={!props.loading}
        fallback={
          <For each={menuChannelPinned()}>
            {() => (
              <div class="w-full flex items-center justify-center p-2">
                <div class="w-8 h-8 rounded-lg bg-bg-light animate-pulse" />
              </div>
            )}
          </For>
        }
      >
        <For each={menuChannelPinned()}>
          {(id, index) => {
            const ch = () => props.resolveChannel(id);
            const isOver = () => overIdx() === index() && dragIdx() !== index();
            return (
              <Show when={ch()}>
                {(c) => (
                  <div
                    data-pinned-index={index()}
                    data-channel-id={id}
                    class="relative"
                    onMouseDown={(e) => startDrag(e, index())}
                  >
                    <Show when={isOver()}>
                      <div class="pointer-events-none absolute left-1 right-1 -top-px h-0.5 bg-primary rounded-full z-10" />
                    </Show>
                    <MenuSectionItem
                      channel={c()}
                      status={props.isLive(id) ? "live" : undefined}
                      selected={watchMode() === null && props.selectedId === id}
                      unread={hasUnread(id)}
                      mentions={channelMentionCount(id)}
                      dimmed={dragIdx() === index()}
                      onClick={() => props.onSelect(c())}
                      onMiddleClick={() => props.onOpenInBrowser(c())}
                      onContextMenu={(x, y) => props.onContextMenu(c(), x, y)}
                    />
                  </div>
                )}
              </Show>
            );
          }}
        </For>
      </Show>
    </Navigation>
  );
}
