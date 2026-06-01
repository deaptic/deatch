import { Show } from "solid-js";
import TitleBar from "../title-bar/TitleBar";
import UpdateBanner from "../update-banner/UpdateBanner";
import Toaster from "../toaster/Toaster";
import Login from "../login/Login";
import Loading from "../ui/Loading";
import Menu from "../menu/Menu";
import PanelHost from "./PanelHost";
import ChatPanes from "./ChatPanes";
import { isPanelOpen, togglePanel } from "../../lib/stores/ui";
import { user } from "../../lib/stores/users";
import { authChecked } from "../../lib/stores/auth";
import { selectedChannel } from "../../lib/stores/channels";
import { toasts, removeToast } from "../../lib/stores/toasts";
import type { AppController } from "../../lib/primitives/createAppController";

interface AppLayoutProps {
  controller: AppController;
}

export default function AppLayout(props: AppLayoutProps) {
  const c = props.controller;
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
                selectedId={selectedChannel()?.id ?? null}
                onLiveChange={(data) => {
                  c.setLiveStreams(data);
                  c.setLiveLoaded(true);
                }}
              />
              <ChatPanes
                channels={c.renderedChannels()}
                userLogin={u().login}
                onJumpToMessage={c.jumpToMessage}
              />
            </div>
          )}
        </Show>
        <Toaster toasts={toasts} onDismiss={removeToast} />
      </div>
    </div>
  );
}
