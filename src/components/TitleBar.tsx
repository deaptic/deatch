import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { activeBroadcaster } from "../broadcaster";

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
        win.startResizeDragging(props.dir as any);
      }}
    />
  );
}

export default function TitleBar() {
  const [maximized, setMaximized] = createSignal(false);

  onMount(async () => {
    setMaximized(await win.isMaximized());
    const unlisten = await win.onResized(async () => {
      setMaximized(await win.isMaximized());
    });
    onCleanup(unlisten);
  });

  return (
    <>
      <div
        data-tauri-drag-region
        class="relative h-10 shrink-0 flex items-center bg-[#0e0e10] border-b border-[#2d2d35] select-none"
      >
        <div data-tauri-drag-region class="flex items-center px-3 pointer-events-none">
          <span class="text-white text-xs font-semibold tracking-tight">Deatch</span>
        </div>
        <div data-tauri-drag-region class="flex-1" />
        <Show when={activeBroadcaster()}>
          {(b) => (
            <div
              data-tauri-drag-region
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#adadb8] text-xs pointer-events-none truncate max-w-[40%]"
            >
              {b().name}
            </div>
          )}
        </Show>
        <div class="flex items-stretch h-full">
          <button
            class="w-11 h-full flex items-center justify-center text-[#adadb8] hover:bg-[#2d2d35] transition-colors cursor-default"
            onClick={() => win.minimize()}
            aria-label="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0 5 H10" stroke="currentColor" stroke-width="1" fill="none" />
            </svg>
          </button>
          <button
            class="w-11 h-full flex items-center justify-center text-[#adadb8] hover:bg-[#2d2d35] transition-colors cursor-default"
            onClick={() => win.toggleMaximize()}
            aria-label={maximized() ? "Restore" : "Maximize"}
          >
            {maximized() ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2.5 0.5 H9.5 V7.5 M0.5 2.5 H7.5 V9.5 H0.5 Z"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="none"
                />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="0.5"
                  y="0.5"
                  width="9"
                  height="9"
                  stroke="currentColor"
                  stroke-width="1"
                  fill="none"
                />
              </svg>
            )}
          </button>
          <button
            class="w-11 h-full flex items-center justify-center text-[#adadb8] hover:bg-[#c42b1c] hover:text-white transition-colors cursor-default"
            onClick={() => win.close()}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M0 0 L10 10 M10 0 L0 10"
                stroke="currentColor"
                stroke-width="1"
                fill="none"
              />
            </svg>
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
