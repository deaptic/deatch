import { lazy, Show, Suspense } from "solid-js";
import TitleBar from "../title-bar/TitleBar.tsx";
import UpdateBanner from "../update-banner/UpdateBanner.tsx";
import Toaster from "../toaster/Toaster.tsx";
import Login from "../login/Login.tsx";
import Loading from "../ui/Loading.tsx";
import Boundary from "../ui/Boundary.tsx";
import Rail from "../rail/Rail.tsx";
import Explore from "../explore/Explore.tsx";
import ChatPanes from "./ChatPanes.tsx";
import Readout from "./Readout.tsx";
import { closeOverlay, isOverlayOpen } from "../../lib/stores/ui.ts";
import { activeView } from "../../lib/stores/view.ts";
import { user } from "../../lib/stores/users.ts";
import { authChecked } from "../../lib/stores/auth.ts";
import { markMentionRead } from "../../lib/stores/inbox.ts";
import { removeToast, toasts } from "../../lib/stores/toasts.ts";
import type { AppController } from "../../lib/primitives/createAppController.ts";

const Settings = lazy(() => import("../settings/Settings.tsx"));
const QuickSwitch = lazy(() => import("../quick-switch/QuickSwitch.tsx"));

type AppLayoutProps = {
  controller: AppController;
};

export default function AppLayout(props: AppLayoutProps) {
  const c = props.controller;

  return (
    <div class="flex flex-col h-screen bg-canvas relative">
      <TitleBar
        onJumpToMessage={(channelId, messageId) => {
          markMentionRead(messageId);
          c.jumpToMessage(channelId, messageId);
        }}
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
              <Login />
            </Show>
          }
        >
          {(u) => (
            <>
              <Rail
                onSelect={c.selectChannel}
                onToggleWatch={c.toggleWatch}
                onFocusInBrowser={c.focusInBrowser}
                onLiveChange={(data) => {
                  c.setLiveStreams(data);
                  c.setLiveLoaded(true);
                }}
              />
              <main class="relative flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                <Show when={activeView() === "explore"}>
                  <Explore onSelectChannel={c.selectChannel} />
                </Show>
                <Show when={activeView() === "settings"}>
                  <Boundary label="Settings failed to load">
                    <Suspense>
                      <Settings />
                    </Suspense>
                  </Boundary>
                </Show>
                <Show when={typeof activeView() === "object"}>
                  <ChatPanes
                    userLogin={u().login}
                    onJumpToMessage={c.jumpToMessage}
                  />
                </Show>
                <Readout />
              </main>
              <Show when={isOverlayOpen("quickSwitch")}>
                <Suspense>
                  <QuickSwitch
                    onSelect={c.selectChannel}
                    onClose={closeOverlay}
                  />
                </Suspense>
              </Show>
            </>
          )}
        </Show>
        <Toaster toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  );
}
