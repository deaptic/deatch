import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { activeBroadcaster } from "../broadcaster";
import { settingsOpen, setSettingsOpen } from "../settings-state";

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
        <button
          class="w-11 h-full flex items-center justify-center text-[#adadb8] hover:bg-[#2d2d35] transition-colors cursor-default"
          aria-label="Inbox"
          title="Inbox"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
            <path fill-rule="evenodd" d="M1 11.27c0-.246.025-.491.076-.732l1.241-5.964A4.5 4.5 0 0 1 6.72 1h6.56a4.5 4.5 0 0 1 4.402 3.574l1.242 5.964c.05.24.076.486.076.732V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3.73Zm3.708-5.385A2.5 2.5 0 0 1 6.72 4h6.56a2.5 2.5 0 0 1 2.012 1.885L16.42 10H14a1 1 0 0 0-.86.49l-.606 1.02a1 1 0 0 1-.86.49H8.306a1 1 0 0 1-.86-.49L6.84 10.49A1 1 0 0 0 5.98 10H3.58l1.128-4.115Z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          class={`w-11 h-full flex items-center justify-center transition-colors cursor-default ${
            settingsOpen() ? "text-white bg-[#2d2d35]" : "text-[#adadb8] hover:bg-[#2d2d35]"
          }`}
          onClick={() => setSettingsOpen((o) => !o)}
          aria-label="Settings"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
            <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="h-5 w-px bg-[#2d2d35] self-center" />
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
