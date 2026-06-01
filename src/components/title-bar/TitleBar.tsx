import { Copy, Inbox, Minus, Settings, Square, User, X } from "lucide-solid";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getVersion } from "@tauri-apps/api/app";
import { selectedChannel } from "../../lib/stores/channels.ts";
import { unreadMentionCount } from "../../lib/stores/inbox.ts";

const win = getCurrentWindow();

type ResizeDir =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NorthEast"
  | "NorthWest"
  | "SouthEast"
  | "SouthWest";

function ResizeHandle(props: { dir: ResizeDir; class: string }) {
  return (
    <div
      class={`absolute z-50 ${props.class}`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        win.startResizeDragging(
          props.dir as Parameters<typeof win.startResizeDragging>[0],
        );
      }}
    />
  );
}

type Props = {
  settingsOpen: boolean;
  inboxOpen: boolean;
  accountOpen: boolean;
  onToggleSettings: () => void;
  onToggleInbox: () => void;
  onToggleAccount: () => void;
};

export default function TitleBar(props: Props) {
  const [maximized, setMaximized] = createSignal(false);
  const [version, setVersion] = createSignal("");

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

  return (
    <>
      <div
        data-tauri-drag-region
        class="relative h-10 shrink-0 flex items-center bg-bg-dark border-b border-border-muted select-none"
      >
        <div data-tauri-drag-region class="flex items-baseline gap-1.5 px-3 pointer-events-none">
          <span class="text-text text-xs font-semibold tracking-tight">Deatch</span>
          <Show when={version()}>
            <span class="text-text-muted text-[10px] tabular-nums">v{version()}</span>
          </Show>
        </div>
        <div data-tauri-drag-region class="flex-1" />
        <Show when={selectedChannel()}>
          {(b) => (
            <div
              data-tauri-drag-region
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text text-base font-semibold pointer-events-none truncate max-w-[40%]"
            >
              {b()?.displayName}
            </div>
          )}
        </Show>
        <button
          data-inbox-toggle
          class={`relative w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${
            props.inboxOpen ? "text-text bg-bg-light" : "text-text-muted hover:bg-bg hover:text-text"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={props.onToggleInbox}
          aria-label="Inbox"
          title="Inbox"
        >
          <Inbox class="w-3.5 h-3.5" />
          <Show when={unreadMentionCount() > 0}>
            <span class="absolute top-1.5 right-1.5 min-w-3.5 h-3.5 px-1 bg-primary rounded-full flex items-center justify-center">
              <span class="text-[9px] font-bold text-text leading-none tabular-nums">
                {unreadMentionCount() > 99 ? "99+" : unreadMentionCount()}
              </span>
            </span>
          </Show>
        </button>
        <button
          data-settings-toggle
          class={`w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${
            props.settingsOpen ? "text-text bg-bg-light" : "text-text-muted hover:bg-bg hover:text-text"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={props.onToggleSettings}
          aria-label="Settings"
          title="Settings"
        >
          <Settings class="w-3.5 h-3.5" />
        </button>
        <button
          data-account-toggle
          class={`w-11 h-full flex items-center justify-center transition-colors cursor-pointer ${
            props.accountOpen
              ? "text-text bg-bg-light"
              : "text-text-muted hover:bg-bg hover:text-text"
          }`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={props.onToggleAccount}
          aria-label="Accounts"
          title="Accounts"
        >
          <User class="w-3.5 h-3.5" />
        </button>
        <div class="h-5 w-px bg-border-muted self-center" />
        <div class="flex items-stretch h-full">
          <button
            class="w-11 h-full flex items-center justify-center text-text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
            onClick={() => win.minimize()}
            aria-label="Minimize"
          >
            <Minus class="w-2.5 h-2.5" />
          </button>
          <button
            class="w-11 h-full flex items-center justify-center text-text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
            onClick={() => win.toggleMaximize()}
            aria-label={maximized() ? "Restore" : "Maximize"}
          >
            {maximized() ? (
              <Copy class="w-2.5 h-2.5" />
            ) : (
              <Square class="w-2.5 h-2.5" />
            )}
          </button>
          <button
            class="w-11 h-full flex items-center justify-center text-text-muted hover:bg-danger hover:text-text transition-colors cursor-pointer"
            onClick={() => win.close()}
            aria-label="Close"
          >
            <X class="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
      {!maximized() && (
        <>
          <ResizeHandle dir="North" class="top-0 left-2 right-2 h-1 cursor-n-resize" />
          <ResizeHandle dir="South" class="bottom-0 left-2 right-2 h-1 cursor-s-resize" />
          <ResizeHandle dir="West" class="left-0 top-2 bottom-2 w-1 cursor-w-resize" />
          <ResizeHandle dir="East" class="right-0 top-2 bottom-2 w-1 cursor-e-resize" />
          <ResizeHandle dir="NorthWest" class="top-0 left-0 w-2 h-2 cursor-nw-resize" />
          <ResizeHandle dir="NorthEast" class="top-0 right-0 w-2 h-2 cursor-ne-resize" />
          <ResizeHandle dir="SouthWest" class="bottom-0 left-0 w-2 h-2 cursor-sw-resize" />
          <ResizeHandle dir="SouthEast" class="bottom-0 right-0 w-2 h-2 cursor-se-resize" />
        </>
      )}
    </>
  );
}
