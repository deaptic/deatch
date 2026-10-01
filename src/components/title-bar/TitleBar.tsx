import { Copy, Inbox as InboxIcon, Minus, Square, X } from "lucide-solid";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { isOverlayOpen, toggleOverlay } from "../../lib/stores/ui.ts";
import { unreadMentionCount } from "../../lib/stores/inbox.ts";
import { POPOVER_TOGGLE } from "../../lib/primitives/dismissOnOutside.ts";
import Badge from "../ui/Badge.tsx";
import Inbox from "../inbox/Inbox.tsx";
import ResizeHandle from "./ResizeHandle.tsx";

const win = getCurrentWindow();

const CONTROL =
  "relative w-11.5 h-full grid place-items-center text-ink-soft transition-colors duration-snap cursor-pointer hover:bg-raised hover:text-ink";
const PRESSED = "bg-raised text-ink";

type Props = {
  onJumpToMessage: (channelId: string, messageId: string) => void;
};

export default function TitleBar(props: Props) {
  const [maximized, setMaximized] = createSignal(false);
  const [version, setVersion] = createSignal("");
  const [inboxAnchor, setInboxAnchor] = createSignal({ x: 0, y: 0 });
  let inboxBtn: HTMLButtonElement | undefined;

  onMount(() => {
    getVersion().then(setVersion).catch(() => {});
  });

  onMount(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
      unlisten?.();
    });
    (async () => {
      setMaximized(await win.isMaximized());
      const off = await win.onResized(async () => {
        setMaximized(await win.isMaximized());
      });
      if (cancelled) off();
      else unlisten = off;
    })();
  });

  createEffect(() => {
    if (!isOverlayOpen("inbox") || !inboxBtn) return;
    const r = inboxBtn.getBoundingClientRect();
    setInboxAnchor({ x: r.left + r.width / 2, y: r.bottom + 4 });
  });

  return (
    <>
      <div
        data-tauri-drag-region
        class="relative h-titlebar shrink-0 flex items-center bg-canvas border-b border-line-soft select-none"
      >
        <div
          data-tauri-drag-region
          class="flex items-center gap-2 pl-4 pointer-events-none"
        >
          <span class="size-2.5 rounded-full bg-accent" />
          <span class="text-body font-semibold text-ink">Deatch</span>
          <Show when={version()}>
            <span class="text-micro text-ink-faint tabular-nums">
              {version()}
            </span>
          </Show>
        </div>
        <div data-tauri-drag-region class="flex-1 h-full" />
        <div class="flex items-stretch h-full">
          <button
            ref={inboxBtn}
            class={`${CONTROL} ${isOverlayOpen("inbox") ? PRESSED : ""}`}
            aria-label="Inbox"
            title="Inbox"
            aria-pressed={isOverlayOpen("inbox")}
            {...{ [POPOVER_TOGGLE]: "" }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleOverlay("inbox")}
          >
            <InboxIcon class="size-4" />
            <Show when={unreadMentionCount() > 0}>
              <span class="absolute top-1 right-1.5">
                <Badge count={unreadMentionCount()} />
              </span>
            </Show>
          </button>
          <div class="w-px h-5 self-center mx-1 bg-line-soft" />
          <button
            class={CONTROL}
            onClick={() => win.minimize()}
            aria-label="Minimize"
          >
            <Minus class="size-3" />
          </button>
          <button
            class={CONTROL}
            onClick={() => win.toggleMaximize()}
            aria-label={maximized() ? "Restore" : "Maximize"}
          >
            {maximized() ? <Copy class="size-3" /> : <Square class="size-3" />}
          </button>
          <button
            class={`${CONTROL} hover:bg-negative! hover:text-on-accent!`}
            onClick={() => win.close()}
            aria-label="Close"
          >
            <X class="size-3" />
          </button>
        </div>
      </div>
      <Show when={isOverlayOpen("inbox")}>
        <Inbox
          x={inboxAnchor().x}
          y={inboxAnchor().y}
          onClose={() => toggleOverlay("inbox")}
          onJump={props.onJumpToMessage}
        />
      </Show>
      {!maximized() && (
        <>
          <ResizeHandle
            dir="North"
            class="top-0 left-2 right-2 h-1 cursor-n-resize"
          />
          <ResizeHandle
            dir="South"
            class="bottom-0 left-2 right-2 h-1 cursor-s-resize"
          />
          <ResizeHandle
            dir="West"
            class="left-0 top-2 bottom-2 w-1 cursor-w-resize"
          />
          <ResizeHandle
            dir="East"
            class="right-0 top-2 bottom-2 w-1 cursor-e-resize"
          />
          <ResizeHandle
            dir="NorthWest"
            class="top-0 left-0 size-2 cursor-nw-resize"
          />
          <ResizeHandle
            dir="NorthEast"
            class="top-0 right-0 size-2 cursor-ne-resize"
          />
          <ResizeHandle
            dir="SouthWest"
            class="bottom-0 left-0 size-2 cursor-sw-resize"
          />
          <ResizeHandle
            dir="SouthEast"
            class="bottom-0 right-0 size-2 cursor-se-resize"
          />
        </>
      )}
    </>
  );
}
