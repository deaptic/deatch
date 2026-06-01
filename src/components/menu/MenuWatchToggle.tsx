import { Eye } from "lucide-solid";
import { Show } from "solid-js";
import MenuSection from "./MenuSection.tsx";
import { selectedChannel } from "../../lib/stores/channels.ts";
import { setWatchMode, watchMode } from "../../lib/stores/watch.ts";
import Avatar from "../ui/Avatar.tsx";

export default function MenuWatchToggle() {
  return (
    <MenuSection divider="top">
      <button
        type="button"
        onClick={() => setWatchMode(watchMode() === null ? "auto" : null)}
        title={watchMode() === null
          ? "Click to start Watch mode"
          : "Click to stop Watch mode"}
        class="group w-full flex items-center justify-center px-2 py-3 cursor-pointer hover:bg-bg transition-colors"
      >
        <div class="relative shrink-0">
          <Show
            when={selectedChannel()}
            fallback={
              <div class="w-8 h-8 rounded-lg bg-bg-light flex items-center justify-center text-text-muted">
                <Eye class="w-4 h-4" />
              </div>
            }
          >
            {(ch) => (
              <Avatar
                src={ch()?.profileImageUrl}
                alt={ch()?.displayName}
                class="w-8 h-8 rounded-lg"
              />
            )}
          </Show>
          <Show when={watchMode() !== null}>
            <div
              role="button"
              tabindex="0"
              title={watchMode() === "manual"
                ? "Manual — click to follow your browser tab"
                : "Auto — click to lock on current"}
              onClick={(e) => {
                e.stopPropagation();
                setWatchMode(watchMode() === "manual" ? "auto" : "manual");
              }}
              onMouseDown={(e) => e.stopPropagation()}
              class={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg hover:bg-bg-light border border-border-muted flex items-center justify-center cursor-pointer transition-colors ${
                watchMode() === "manual" ? "text-danger" : "text-emerald-500"
              }`}
            >
              <Eye class="w-3.5 h-3.5" />
            </div>
          </Show>
        </div>
      </button>
    </MenuSection>
  );
}
