import { For } from "solid-js";
import Button from "../../kit/Button.tsx";

type Props<K extends string> = {
  items: readonly { key: K; label: string; description: string }[];
  isOn: (key: K) => boolean;
  disabled: (key: K) => boolean;
  onToggle: (key: K, on: boolean) => void;
};

export default function TypeChips<K extends string>(props: Props<K>) {
  return (
    <div class="flex flex-wrap gap-1.5 px-4 pb-3">
      <For each={props.items}>
        {(item) => (
          <Button
            variant="toggle"
            size="sm"
            pressed={props.isOn(item.key)}
            disabled={props.disabled(item.key)}
            data-tip={item.description}
            onClick={() => props.onToggle(item.key, !props.isOn(item.key))}
          >
            {item.label}
          </Button>
        )}
      </For>
    </div>
  );
}
