import { Copy } from "lucide-solid";
import { Show } from "solid-js";
import ContextMenuItem from "../ui/ContextMenuItem.tsx";
import ContextMenuDivider from "../ui/ContextMenuDivider.tsx";

type Props = {
  show: boolean;
  data: unknown;
  onClose: () => void;
};

export default function CopyPayloadItem(props: Props) {
  return (
    <Show when={props.show}>
      <ContextMenuDivider />
      <ContextMenuItem
        label="Copy Payload"
        icon={<Copy class="w-3.5 h-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(props.data, null, 2));
          props.onClose();
        }}
      />
    </Show>
  );
}
