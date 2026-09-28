import { Copy } from "lucide-solid";
import { Show } from "solid-js";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";

type Props = {
  show: boolean;
  data: unknown;
  onClose: () => void;
};

export default function CopyPayloadItem(props: Props) {
  return (
    <Show when={props.show}>
      <MenuDivider />
      <MenuItem
        label="Copy Payload"
        icon={<Copy class="size-3.5" />}
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(props.data, null, 2));
          props.onClose();
        }}
      />
    </Show>
  );
}
