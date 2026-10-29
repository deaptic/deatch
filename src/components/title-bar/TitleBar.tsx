import {
  Activity,
  Copy,
  Inbox as InboxIcon,
  Minus,
  Square,
  X,
} from "lucide-solid";
import { createSignal, onMount, Show } from "solid-js";
import { appVersion } from "../../lib/api/app.ts";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
} from "../../lib/api/window.ts";
import { windowMaximized as maximized } from "../../lib/stores/window.ts";
import { isOverlayOpen, toggleOverlay } from "../../lib/stores/ui.ts";
import { unreadMentionCount } from "../../lib/stores/inbox.ts";
import { advancedDeveloperMode } from "../../lib/stores/preferences.ts";
import { POPOVER_TOGGLE } from "../../lib/reactive/dismissOnOutside.ts";
import Badge from "../ui/Badge.tsx";
import { OVERLAY_GAP } from "../ui/Popover.tsx";
import Inbox from "../inbox/Inbox.tsx";
import Diagnostics from "../diagnostics/Diagnostics.tsx";
import ResizeHandle from "./ResizeHandle.tsx";
import { t } from "../../lib/i18n/index.ts";

const CONTROL =
  "relative w-11.5 h-full grid place-items-center text-ink-soft transition-colors duration-snap cursor-pointer hover:bg-raised hover:text-ink";
const PRESSED = "bg-raised text-ink";

function below(button: HTMLElement | undefined) {
  const r = button?.getBoundingClientRect();
  return r
    ? { x: r.left + r.width / 2, y: r.bottom + OVERLAY_GAP }
    : { x: 0, y: 0 };
}

type Props = {
  onJumpToMessage: (broadcasterId: string, messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function TitleBar(props: Props) {
  const [version, setVersion] = createSignal("");
  let inboxBtn: HTMLButtonElement | undefined;
  let diagnosticsBtn: HTMLButtonElement | undefined;

  onMount(() => {
    appVersion({ silent: true })
      .then(setVersion)
      .catch(() => {});
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
          <span class="text-body font-semibold text-ink">Deatch</span>
          <Show when={version()}>
            <span class="text-micro text-ink-faint tabular-nums">
              {version()}
            </span>
          </Show>
        </div>
        <div data-tauri-drag-region class="flex-1 h-full" />
        <div class="flex items-stretch h-full">
          <Show when={advancedDeveloperMode()}>
            <button
              ref={diagnosticsBtn}
              class={`${CONTROL} ${
                isOverlayOpen("diagnostics") ? PRESSED : ""
              }`}
              aria-label={t("TITLE_BAR_DIAGNOSTICS")}
              data-tip={t("TITLE_BAR_DIAGNOSTICS")}
              aria-pressed={isOverlayOpen("diagnostics")}
              {...{ [POPOVER_TOGGLE]: "" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleOverlay("diagnostics")}
            >
              <Activity class="size-4" />
            </button>
          </Show>
          <button
            ref={inboxBtn}
            class={`${CONTROL} ${isOverlayOpen("inbox") ? PRESSED : ""}`}
            aria-label={t("TITLE_BAR_INBOX")}
            data-tip={t("TITLE_BAR_INBOX")}
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
            onClick={() => minimizeWindow().catch(() => {})}
            aria-label={t("TITLE_BAR_MINIMIZE")}
          >
            <Minus class="size-3" />
          </button>
          <button
            class={CONTROL}
            onClick={() => toggleMaximizeWindow().catch(() => {})}
            aria-label={
              maximized() ? t("TITLE_BAR_RESTORE") : t("TITLE_BAR_MAXIMIZE")
            }
          >
            {maximized() ? <Copy class="size-3" /> : <Square class="size-3" />}
          </button>
          <button
            class={`${CONTROL} hover:bg-negative! hover:text-on-accent!`}
            onClick={() => closeWindow().catch(() => {})}
            aria-label={t("TITLE_BAR_CLOSE")}
          >
            <X class="size-3" />
          </button>
        </div>
      </div>
      <Show when={isOverlayOpen("inbox")}>
        <Inbox
          {...below(inboxBtn)}
          onClose={() => toggleOverlay("inbox")}
          onJump={props.onJumpToMessage}
          onOpenChannel={props.onOpenChannel}
        />
      </Show>
      <Show when={advancedDeveloperMode() && isOverlayOpen("diagnostics")}>
        <Diagnostics
          {...below(diagnosticsBtn)}
          onClose={() => toggleOverlay("diagnostics")}
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
