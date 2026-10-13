import { Copy } from "lucide-solid";
import { Show } from "solid-js";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import { copyField } from "../../lib/utils/clipboard.ts";

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
        label="Copy payload"
        icon={<Copy />}
        onClick={() => {
          copyField(JSON.stringify(props.data, null, 2));
          props.onClose();
        }}
      />
    </Show>
  );
}
