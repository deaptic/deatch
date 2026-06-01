import { Show } from "solid-js";
import ContextMenuItem from "../ui/ContextMenuItem";
import ContextMenuDivider from "../ui/ContextMenuDivider";
import CopyIcon from "../icons/CopyIcon";

interface Props {
  show: boolean;
  data: unknown;
  onClose: () => void;
}

export default function CopyPayloadItem(props: Props) {
  return (
    <Show when={props.show}>
      <ContextMenuDivider />
      <ContextMenuItem
        label="Copy Payload"
        icon={<CopyIcon class="w-3.5 h-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(props.data, null, 2));
          props.onClose();
        }}
      />
    </Show>
  );
}
