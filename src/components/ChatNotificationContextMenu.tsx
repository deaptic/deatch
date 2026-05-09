import { Show } from "solid-js";
import ContextMenu from "../ui/ContextMenu";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import CopyIcon from "../icons/CopyIcon";
import { notifContextMenu, closeNotifContextMenu } from "../chat-state";
import { developerMode } from "../feed-prefs";

export default function ChatNotificationContextMenu() {
  const cm = () => notifContextMenu()!;
  return (
    <ContextMenu x={cm().x} y={cm().y} onClose={closeNotifContextMenu}>
      <ContextMenuItem
        label="Copy Text"
        icon={<CopyIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(cm().item.system_message);
          closeNotifContextMenu();
        }}
      />
      <Show when={developerMode()}>
        <ContextMenuDivider />
        <ContextMenuItem
          label="Copy Payload"
          icon={<CopyIcon class="w-3.5 h-3.5" />}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(cm().item, null, 2));
            closeNotifContextMenu();
          }}
        />
      </Show>
    </ContextMenu>
  );
}
