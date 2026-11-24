import { lazy, Show, Suspense } from "solid-js";
import TitleBar from "./title-bar/TitleBar.tsx";
import { UpdateBanner } from "../features/updater/index.ts";
import Toaster from "../kit/Toaster.tsx";
import { EmoteCard, HoverZoom } from "../features/emotes/index.ts";
import TooltipHost from "../kit/TooltipHost.tsx";
import Loading from "../kit/Loading.tsx";
import Boundary from "../kit/Boundary.tsx";
import { Rail } from "../features/rail/index.ts";
import { Explore } from "../features/explore/index.ts";
import ChatPanes from "./ChatPanes.tsx";
import FlashHost from "../kit/FlashHost.tsx";
import {
  closeOverlay,
  isOverlayOpen,
  activeView,
} from "../features/navigation/index.ts";
import { user } from "../features/users/index.ts";
import { authChecked, Login } from "../features/login/index.ts";
import * as inbox from "../features/inbox/index.ts";
import { removeToast, toasts } from "../kit/toasts.ts";
import type { AppController } from "./createAppController.ts";
import { t } from "../shared/i18n/index.ts";

const Settings = lazy(() =>
  import("../features/settings/index.ts").then((m) => ({
    default: m.Settings,
  })),
);
const QuickSwitch = lazy(() =>
  import("../features/quick-switch/index.ts").then((m) => ({
    default: m.QuickSwitch,
  })),
);

type AppLayoutProps = {
  controller: AppController;
};

export default function AppLayout(props: AppLayoutProps) {
  const c = props.controller;

  return (
    <div class="flex flex-col h-screen bg-canvas relative">
      <TitleBar
        onJumpToMessage={(broadcasterId, messageId) => {
          inbox.markRead(messageId);
          c.jumpToMessage(broadcasterId, messageId);
        }}
        onOpenChannel={c.openChannel}
      />
      <UpdateBanner />
      <div class="relative flex-1 min-h-0 flex overflow-hidden">
        <Show
          when={user()}
          fallback={
            <Show
              when={authChecked()}
              fallback={
                <main class="flex-1 flex items-center justify-center">
                  <Loading size={32} />
                </main>
              }
            >
              <Boundary>
                <Login />
              </Boundary>
            </Show>
          }
        >
          {(u) => (
            <>
              <Boundary>
                <Rail onSelect={c.selectChannel} onToggleLink={c.toggleLink} />
              </Boundary>
              <main class="relative flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                <Show when={activeView() === "explore"}>
                  <Boundary>
                    <Explore onSelectChannel={c.selectChannel} />
                  </Boundary>
                </Show>
                <Show when={activeView() === "settings"}>
                  <Boundary label={t("SETTINGS_BOUNDARY_ERROR")}>
                    <Suspense>
                      <Settings />
                    </Suspense>
                  </Boundary>
                </Show>
                <Show when={typeof activeView() === "object"}>
                  <ChatPanes
                    userLogin={u().login}
                    onOpenChannel={c.openChannel}
                    onJumpToMessage={c.jumpToMessage}
                  />
                </Show>
                <FlashHost />
              </main>
              <Show when={isOverlayOpen("quickSwitch")}>
                <Boundary silent>
                  <Suspense>
                    <QuickSwitch
                      onSelect={c.selectChannel}
                      onClose={closeOverlay}
                    />
                  </Suspense>
                </Boundary>
              </Show>
            </>
          )}
        </Show>
        <Toaster toasts={toasts} onDismiss={removeToast} />
        <Boundary silent>
          <HoverZoom />
        </Boundary>
        <Boundary silent>
          <EmoteCard />
        </Boundary>
        <TooltipHost />
      </div>
    </div>
  );
}
