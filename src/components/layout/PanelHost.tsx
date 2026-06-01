import { Show } from "solid-js";
import { isPanelOpen, setOpenPanel } from "../../lib/stores/ui";
import { markMentionRead } from "../../lib/stores/inbox";
import Settings from "../settings/Settings";
import Inbox from "../inbox/Inbox";
import Account from "../account/Account";

interface PanelHostProps {
  onJump: (channelId: string, messageId: string) => void;
}

export default function PanelHost(props: PanelHostProps) {
  return (
    <>
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
    </>
  );
}
