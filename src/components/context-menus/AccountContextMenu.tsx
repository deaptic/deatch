import { Show } from "solid-js";
import ContextMenu from "../../ui/ContextMenu";
import ContextMenuItem from "../../ui/ContextMenuItem";
import ContextMenuDivider from "../../ui/ContextMenuDivider";
import CopyIcon from "../../icons/CopyIcon";
import { logout } from "../../services/auth";
import { user } from "../../state/users";
import { advancedDeveloperMode } from "../../state/preferences";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

export default function AccountContextMenu(props: Props) {
  return (
    <ContextMenu x={props.x} y={props.y} onClose={props.onClose}>
      <ContextMenuItem
        label="Log out"
        danger
        onClick={() => { props.onClose(); logout(); }}
      />
      <Show when={advancedDeveloperMode() && user()}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(user(), null, 2));
            props.onClose();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
