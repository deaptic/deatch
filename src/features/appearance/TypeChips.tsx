import { For, Show, useContext } from "solid-js";
import Button from "../../kit/Button.tsx";
import { FilterQuery } from "../../kit/filterQuery.ts";
import { matchesQuery } from "../../shared/textQuery.ts";

type Props<K extends string> = {
  label: string;
  description: string;
  items: readonly { key: K; label: string; description: string }[];
  isOn: (key: K) => boolean;
  disabled: (key: K) => boolean;
  onToggle: (key: K, on: boolean) => void;
};

export default function TypeChips<K extends string>(props: Props<K>) {
  const query = useContext(FilterQuery);
  const matches = () =>
    matchesQuery(
      query(),
      props.label,
      props.description,
      ...props.items.map((i) => i.label),
    );
  return (
    <Show when={matches()}>
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
    </Show>
  );
}
