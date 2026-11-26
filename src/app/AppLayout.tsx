import { lazy, Show, Suspense } from "solid-js";
import TitleBar from "./title-bar/TitleBar.tsx";
import { UpdateBanner } from "../features/updater/index.ts";
import { Changelog, UpdateNotes } from "../features/changelog/index.ts";
import { StreamerModeBanner } from "../features/streamer-mode/index.ts";
import Toaster from "../kit/Toaster.tsx";
import { EmoteCard, HoverZoom } from "../features/emotes/index.ts";
import TooltipHost from "../kit/TooltipHost.tsx";
import Loading from "../kit/Loading.tsx";
import Boundary from "../kit/Boundary.tsx";
import { Rail } from "../features/rail/index.ts";
import { Explore } from "../features/explore/index.ts";
import ChatPanes from "./ChatPanes.tsx";
import FlashHost from "../kit/FlashHost.tsx";
import { LinkPrompt } from "../features/previews/index.ts";
import {
  closeOverlay,
  isOverlayOpen,
  activeView,
} from "../features/navigation/index.ts";
import { user } from "../features/users/index.ts";
import { authChecked, Login } from "../features/login/index.ts";
import { Inbox } from "../features/inbox/index.ts";
import { removeToast, toasts } from "../kit/toasts.ts";
import type { AppController } from "./createAppController.ts";
import { t } from "../shared/i18n/index.ts";

const Settings = lazy(() =>
  import("../features/settings/index.ts").then((m) => ({
    default: m.Settings,
  })),
);
const ShortcutSheet = lazy(() =>
  import("../features/settings/index.ts").then((m) => ({
    default: m.ShortcutSheet,
  })),
);
const QuickSwitch = lazy(() =>
  import("../features/quick-switch/index.ts").then((m) => ({
    default: m.QuickSwitch,
  })),
);
const SearchPalette = lazy(() =>
  import("../features/search/index.ts").then((m) => ({
    default: m.SearchPalette,
  })),
);

type AppLayoutProps = {
  controller: AppController;
};

export default function AppLayout(props: AppLayoutProps) {
  const c = props.controller;

  return (
    <div class="flex flex-col h-screen bg-canvas relative">
      <TitleBar />
      <UpdateBanner />
      <StreamerModeBanner />
      <div class="relative flex-1 min-h-0 flex overflow-hidden">
        <Show
          when={user()}
          fallback={
            <Show
              when={authChecked()}
              fallback={
                <main class="flex-1 flex items-center justify-center">
                  <Loading size="lg" />
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
                <Show when={activeView() === "inbox"}>
                  <Boundary>
                    <Inbox
                      onJump={c.jumpToMessage}
                      onOpenChannel={c.openChannel}
                    />
                  </Boundary>
                </Show>
                <Show when={activeView() === "changelog"}>
                  <Boundary>
                    <Changelog />
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
                <div class="absolute top-3 right-4 z-20 pointer-events-none">
                  <FlashHost />
                </div>
              </main>
              <Show when={isOverlayOpen("search")}>
                <Boundary silent>
                  <Suspense>
                    <SearchPalette
                      onJump={c.jumpToMessage}
                      onClose={closeOverlay}
                    />
                  </Suspense>
                </Boundary>
              </Show>
              <Show when={isOverlayOpen("shortcuts")}>
                <Boundary silent>
                  <Suspense>
                    <ShortcutSheet onClose={closeOverlay} />
                  </Suspense>
                </Boundary>
              </Show>
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
        <div class="absolute bottom-20 right-4 z-50 pointer-events-none">
          <Toaster toasts={toasts} onDismiss={removeToast} />
        </div>
        <Boundary silent>
          <HoverZoom />
        </Boundary>
        <Boundary silent>
          <EmoteCard />
        </Boundary>
        <Boundary silent>
          <LinkPrompt />
        </Boundary>
        <Boundary silent>
          <UpdateNotes />
        </Boundary>
        <TooltipHost />
      </div>
    </div>
  );
}
