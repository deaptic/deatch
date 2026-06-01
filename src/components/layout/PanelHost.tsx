import { Show, Suspense, lazy } from "solid-js";
import { isPanelOpen, setOpenPanel } from "../../lib/stores/ui";
import { markMentionRead } from "../../lib/stores/inbox";
import Boundary from "../ui/Boundary";

const Settings = lazy(() => import("../settings/Settings"));
const Inbox = lazy(() => import("../inbox/Inbox"));
const Account = lazy(() => import("../account/Account"));

type PanelHostProps = {
  onJump: (channelId: string, messageId: string) => void;
}

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
