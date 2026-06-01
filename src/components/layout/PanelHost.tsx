import { lazy, Show, Suspense } from "solid-js";
import { isPanelOpen, setOpenPanel } from "../../lib/stores/ui.ts";
import { markMentionRead } from "../../lib/stores/inbox.ts";
import Boundary from "../ui/Boundary.tsx";

const Settings = lazy(() => import("../settings/Settings.tsx"));
const Inbox = lazy(() => import("../inbox/Inbox.tsx"));
const Account = lazy(() => import("../account/Account.tsx"));

type PanelHostProps = {
  onJump: (channelId: string, messageId: string) => void;
};

export default function PanelHost(props: PanelHostProps) {
  return (
    <Boundary label="Panel failed to load">
      <Suspense>
        <Show when={isPanelOpen("settings")}>
          <Settings onClose={() => setOpenPanel(null)} />
        </Show>
        <Show when={isPanelOpen("inbox")}>
          <Inbox
            onClose={() => setOpenPanel(null)}
            onJump={(channelId, messageId) => {
              markMentionRead(messageId);
              props.onJump(channelId, messageId);
            }}
          />
        </Show>
        <Show when={isPanelOpen("account")}>
          <Account onClose={() => setOpenPanel(null)} />
        </Show>
      </Suspense>
    </Boundary>
  );
}
