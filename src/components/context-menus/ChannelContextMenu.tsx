import { Show } from "solid-js";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import CopyIcon from "../icons/CopyIcon";
import type { User } from "../../lib/types/twitch/user";

type Props = {
  x: number;
  y: number;
  ch: User;
  isPinned: boolean;
  developerMode: boolean;
  onClose: () => void;
  onOpenInBrowser: (ch: User) => void;
  onPin: (ch: User) => void;
  onUnpin: (userId: string) => void;
};

export default function ChannelContextMenu(props: Props) {
  return (
    <ContextMenu x={props.x} y={props.y} onClose={props.onClose}>
      <ContextMenuItem
        label="Open in browser"
        onClick={() => { props.onOpenInBrowser(props.ch); props.onClose(); }}
      />
      <Show
        when={props.isPinned}
        fallback={
          <ContextMenuItem
            label="Pin"
            onClick={() => { props.onPin(props.ch); props.onClose(); }}
          />
        }
      >
        <ContextMenuItem
          label="Unpin"
          onClick={() => { props.onUnpin(props.ch?.id); props.onClose(); }}
        />
      </Show>
      <Show when={props.developerMode}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(props.ch, null, 2));
            props.onClose();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
