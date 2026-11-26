import Kbd from "../../kit/Kbd.tsx";
import Text from "../../kit/Text.tsx";
import type { ShortcutRow as Row } from "./keyboard.ts";

export default function ShortcutRow(props: { row: Row }) {
  return (
    <div data-match class="flex items-center justify-between gap-6 px-4 h-10">
      <Text size="md" tone="primary">
        {props.row.label}
      </Text>
      <Kbd combo={props.row.combo} />
    </div>
  );
}
