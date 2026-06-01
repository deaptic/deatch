import { Show } from "solid-js";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import CopyPayloadItem from "./CopyPayloadItem";
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
      <CopyPayloadItem
        show={props.developerMode}
        data={props.ch}
        onClose={props.onClose}
      />
    </ContextMenu>
  );
}
