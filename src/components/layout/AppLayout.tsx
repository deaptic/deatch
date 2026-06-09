import { Show } from "solid-js";
import TitleBar from "../title-bar/TitleBar.tsx";
import UpdateBanner from "../update-banner/UpdateBanner.tsx";
import Toaster from "../toaster/Toaster.tsx";
import Login from "../login/Login.tsx";
import Loading from "../ui/Loading.tsx";
import Menu from "../menu/Menu.tsx";
import Dashboard from "../dashboard/Dashboard.tsx";
import PanelHost from "./PanelHost.tsx";
import ChatPanes from "./ChatPanes.tsx";
import {
  dashboardOpen,
  isPanelOpen,
  setDashboardOpen,
  togglePanel,
} from "../../lib/stores/ui.ts";
import { user } from "../../lib/stores/users.ts";
import { authChecked } from "../../lib/stores/auth.ts";
import { selectedChannel } from "../../lib/stores/channels.ts";
import { removeToast, toasts } from "../../lib/stores/toasts.ts";
import type { User } from "../../lib/types/twitch/user.ts";
import type { AppController } from "../../lib/primitives/createAppController.ts";

type AppLayoutProps = {
  controller: AppController;
};

export default function AppLayout(props: AppLayoutProps) {
  const c = props.controller;

  function selectChannel(channel: User) {
    setDashboardOpen(false);
    c.selectChannel(channel);
  }

  return (
    <div class="flex flex-col h-screen bg-bg-dark relative">
      <TitleBar
        settingsOpen={isPanelOpen("settings")}
        inboxOpen={isPanelOpen("inbox")}
        accountOpen={isPanelOpen("account")}
        onToggleSettings={() => togglePanel("settings")}
        onToggleInbox={() => togglePanel("inbox")}
        onToggleAccount={() => togglePanel("account")}
      />
      <UpdateBanner />
      <div class="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <PanelHost onJump={c.jumpToMessage} />
        <Show
          when={user()}
          fallback={
            <Show
              when={authChecked()}
              fallback={
                <main class="flex-1 bg-bg-dark flex items-center justify-center">
                  <Loading size={48} />
                </main>
              }
            >
              <Login />
            </Show>
          }
        >
          {(u) => (
            <div class="flex flex-1 min-h-0 bg-bg-dark overflow-hidden">
              <Menu
                onSelect={c.selectChannel}
                selectedId={dashboardOpen() ? null : selectedChannel()?.id ??
                  null}
                onLiveChange={(data) => {
                  c.setLiveStreams(data);
                  c.setLiveLoaded(true);
                }}
              />
              <Show
                when={dashboardOpen()}
                fallback={
                  <ChatPanes
                    channels={c.renderedChannels()}
                    userLogin={u().login}
                    onJumpToMessage={c.jumpToMessage}
                  />
                }
              >
                <Dashboard onSelectChannel={selectChannel} />
              </Show>
            </div>
          )}
        </Show>
        <Toaster toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  );
}
