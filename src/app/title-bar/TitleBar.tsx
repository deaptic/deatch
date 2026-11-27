import Boundary from "../../kit/Boundary.tsx";
import {
  Activity,
  Copy,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Square,
  X,
  Sparkles,
} from "lucide-solid";
import { Show } from "solid-js";
import { updates } from "../../features/updater/index.ts";
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
} from "../../platform/window.ts";
import { windowMaximized as maximized } from "../../platform/windowState.ts";
import {
  activeView,
  isOverlayOpen,
  showChangelog,
  toggleOverlay,
} from "../../features/navigation/index.ts";
import { user } from "../../features/users/index.ts";
import {
  developerMode,
  appearanceRailExpanded,
  setAppearanceRailExpanded,
} from "../../features/preferences/index.ts";
import { POPOVER_TOGGLE } from "../../shared/solid/dismissOnOutside.ts";
import TitleBarButton from "../../kit/TitleBarButton.tsx";
import Divider from "../../kit/Divider.tsx";
import { OVERLAY_GAP } from "../../kit/Popover.tsx";
import { AppearancePanel } from "../../features/appearance/index.ts";
import { Diagnostics } from "../../features/diagnostics/index.ts";
import ResizeHandle from "./ResizeHandle.tsx";
import { t } from "../../shared/i18n/index.ts";
import Transition from "../../kit/Transition.tsx";
import Text from "../../kit/Text.tsx";

function below(button: HTMLElement | undefined) {
  const r = button?.getBoundingClientRect();
  return r
    ? { x: r.left + r.width / 2, y: r.bottom + OVERLAY_GAP }
    : { x: 0, y: 0 };
}

export default function TitleBar() {
  const version = updates.version;
  let appearanceBtn: HTMLButtonElement | undefined;
  let diagnosticsBtn: HTMLButtonElement | undefined;

  return (
    <>
      <div
        data-tauri-drag-region
        class="relative h-titlebar shrink-0 flex items-center bg-surface select-none"
      >
        <TitleBarButton
          label={t(
            appearanceRailExpanded()
              ? "RAIL_COLLAPSE_LABEL"
              : "RAIL_EXPAND_LABEL",
          )}
          aria-expanded={appearanceRailExpanded()}
          onClick={() => setAppearanceRailExpanded(!appearanceRailExpanded())}
        >
          <Show
            when={appearanceRailExpanded()}
            fallback={<PanelLeftOpen class="size-4" />}
          >
            <PanelLeftClose class="size-4" />
          </Show>
        </TitleBarButton>
        <div
          data-tauri-drag-region
          class="flex items-center gap-2 pl-1 pointer-events-none"
        >
          <Text size="md" bold tone="primary">
            Deatch
          </Text>
          <Show when={version()}>
            <Text size="xs" tone="faint" tabular>
              {version()}
            </Text>
          </Show>
        </div>
        <div data-tauri-drag-region class="flex-1 h-full" />
        <div class="flex items-stretch h-full">
          <Show when={developerMode()}>
            <TitleBarButton
              ref={diagnosticsBtn}
              label={t("TITLE_BAR_DIAGNOSTICS_LABEL")}
              data-tip={t("TITLE_BAR_DIAGNOSTICS_LABEL")}
              pressed={isOverlayOpen("diagnostics")}
              {...{ [POPOVER_TOGGLE]: "" }}
              onClick={() => toggleOverlay("diagnostics")}
            >
              <Activity class="size-4" />
            </TitleBarButton>
          </Show>
          <Show when={user()}>
            <TitleBarButton
              label={t("TITLE_BAR_CHANGELOG_LABEL")}
              data-tip={t("TITLE_BAR_CHANGELOG_LABEL")}
              pressed={activeView() === "changelog"}
              onClick={showChangelog}
            >
              <Sparkles class="size-4" />
            </TitleBarButton>
          </Show>
          <TitleBarButton
            ref={appearanceBtn}
            label={t("TITLE_BAR_APPEARANCE_LABEL")}
            data-tip={t("TITLE_BAR_APPEARANCE_LABEL")}
            pressed={isOverlayOpen("appearance")}
            {...{ [POPOVER_TOGGLE]: "" }}
            onClick={() => toggleOverlay("appearance")}
          >
            <SlidersHorizontal class="size-4" />
          </TitleBarButton>
          <Divider vertical class="self-center mx-1" />
          <TitleBarButton
            label={t("TITLE_BAR_MINIMIZE_LABEL")}
            onClick={() => minimizeWindow().catch(() => {})}
          >
            <Minus class="size-3" />
          </TitleBarButton>
          <TitleBarButton
            label={
              maximized()
                ? t("TITLE_BAR_RESTORE_LABEL")
                : t("TITLE_BAR_MAXIMIZE_LABEL")
            }
            onClick={() => toggleMaximizeWindow().catch(() => {})}
          >
            {maximized() ? (
              <Copy class="size-3 enter-swap" />
            ) : (
              <Square class="size-3 enter-swap" />
            )}
          </TitleBarButton>
          <TitleBarButton
            variant="close"
            label={t("TITLE_BAR_CLOSE_LABEL")}
            onClick={() => closeWindow().catch(() => {})}
          >
            <X class="size-3" />
          </TitleBarButton>
        </div>
      </div>
      <Transition when={isOverlayOpen("appearance")}>
        {() => (
          <Boundary silent>
            <AppearancePanel
              {...below(appearanceBtn)}
              onClose={() => toggleOverlay("appearance")}
            />
          </Boundary>
        )}
      </Transition>
      <Transition when={developerMode() && isOverlayOpen("diagnostics")}>
        {() => (
          <Boundary silent>
            <Diagnostics
              {...below(diagnosticsBtn)}
              onClose={() => toggleOverlay("diagnostics")}
            />
          </Boundary>
        )}
      </Transition>
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
