import { Search, X } from "lucide-solid";
import { Show } from "solid-js";
import Field from "../ui/Field.tsx";
import IconButton from "../ui/IconButton.tsx";

type Props = {
  value: string;
  onInput: (value: string) => void;
};

export default function ExploreSearch(props: Props) {
  return (
    <Field
      size="lg"
      class="w-full mb-8"
      icon={<Search />}
      ref={(el) => queueMicrotask(() => el.focus())}
      value={props.value}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      placeholder="Search channels and categories"
      trailing={
        <Show
          when={props.value}
          fallback={
            <kbd class="text-small text-ink-faint bg-raised rounded-xs px-1.5 py-0.5 font-sans">
              Ctrl K
            </kbd>
          }
        >
          <IconButton
            label="Clear search"
            size="sm"
            onClick={() => props.onInput("")}
          >
            <X class="size-4" />
          </IconButton>
        </Show>
      }
    />
  );
}
